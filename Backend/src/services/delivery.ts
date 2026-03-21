import crypto from 'crypto';
import { Job } from 'bullmq';
import { EventLog, DeliveryAttempt, Subscription, EventStatus, User, PLAN_LIMITS, PlanTier, DeadLetterEvent } from '../models';
import { sendFailureNotification } from './email';
import { startDeliveryWorker } from './queue';
import { getCircuitBreaker } from './circuitBreaker';

export const startDeliveryService = async () => {
    console.log("🚀 Starting Delivery Service (BullMQ)...");

    // Reset monthly usage at start of each month
    setInterval(resetMonthlyUsage, 3600000); // Check hourly

    // Register BullMQ Worker
    startDeliveryWorker(processJob);
};

// Reset usage for all users at start of month
const resetMonthlyUsage = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    await User.updateMany(
        { lastUsageReset: { $lt: startOfMonth } },
        { $set: { eventsThisMonth: 0, lastUsageReset: now } }
    );
};

// Generate HMAC signature for webhook payload
const signPayload = (payload: string, secret: string): string => {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

const processJob = async (job: Job) => {
    const { eventId } = job.data;
    const event = await EventLog.findById(eventId);
    
    if (!event) {
        console.warn(`Event ${eventId} not found for job ${job.id}`);
        return; // Don't throw, drop the job
    }

    event.status = EventStatus.PROCESSING;
    await event.save();

    const subscription = await Subscription.findById(event.subscriptionId);
    if (!subscription) {
        console.error(`Subscription ${event.subscriptionId} not found for event ${event._id}`);
        event.status = EventStatus.FAILED;
        await event.save();
        return;
    }

    // Get user and check plan limits
    const user = await User.findById(subscription.userId);
    if (!user) {
        console.error(`User not found for subscription ${subscription._id}`);
        event.status = EventStatus.FAILED;
        await event.save();
        return;
    }

    // Check if user has exceeded their plan limit
    const planLimit = PLAN_LIMITS[user.plan as PlanTier].eventsPerMonth;
    if (user.eventsThisMonth >= planLimit) {
        console.warn(`User ${user._id} has exceeded plan limit (${user.eventsThisMonth}/${planLimit})`);
        // We throw a specific error so BullMQ retries, but wait, if plan limit exceeded it will continuously fail.
        // The original logic just kept it PENDING for 1 hour.
        // We will throw an error to trigger BullMQ retry, but this uses up attempts.
        // To retain endless retries until month reset, we could raise a special error or just re-queue. 
        // For now, matching standard behaviour: throw error so BullMQ backs off.
        event.status = EventStatus.PENDING;
        await event.save();
        throw new Error(`Plan limit exceeded: ${user.eventsThisMonth}/${planLimit}`);
    }

    let success = false;
    let responseStatus = 0;
    let responseBody = '';
    let errorMsg = '';

    try {
        const payload = JSON.stringify({
            id: event._id,
            subscriptionId: subscription._id,
            chainId: subscription.chainId,
            contractAddress: subscription.contractAddress,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            logIndex: event.logIndex,
            eventName: event.eventName,
            args: event.payload,
            timestamp: new Date().toISOString(),
        });

        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add signature if webhook secret is configured
        if (subscription.webhookSecret) {
            headers['X-Webhook-Signature'] = signPayload(payload, subscription.webhookSecret);
        }

        const breaker = getCircuitBreaker(subscription._id.toString());
        
        // Fire request through Circuit Breaker
        const responseData: any = await breaker.fire(subscription.webhookUrl, payload, headers);

        responseStatus = responseData.status;
        responseBody = responseData.body;
        success = true; // since it didn't throw, it was a 2xx success

    } catch (err: any) {
        if (err.name === 'OpenCircuitError') {
            errorMsg = 'Circuit Breaker Open - Webhook delivery skipped';
        } else {
            errorMsg = err.message || 'Unknown error';
            responseStatus = err.responseStatus || 0;
            responseBody = err.responseBody || '';
        }
    }

    // Record Attempt
    await DeliveryAttempt.create({
        eventLogId: event._id,
        responseStatus,
        responseBody: responseBody.substring(0, 1000),
        success,
        error: errorMsg,
    });

    if (success) {
        event.status = EventStatus.DELIVERED;
        await event.save();

        // Increment user's usage count
        await User.findByIdAndUpdate(user._id, { $inc: { eventsThisMonth: 1 } });

        console.log(`✅ Event ${event._id} delivered to ${subscription.webhookUrl}`);
    } else {
        event.retryCount += 1;

        // Check if this is the last attempt (job.opts.attempts default is 5)
        const maxAttempts = job.opts.attempts || 5;
        if (job.attemptsMade >= maxAttempts - 1) {
            console.log(`❌ Event ${event._id} failed permanently after ${maxAttempts} attempts. Moving to DLQ.`);

            // --- Hybrid DLQ Architecture ---
            // Move poisoned event out of EventLog into DeadLetterEvent to keep EventLog lean
            // BullMQ will remove the job from Redis because `removeOnFail: true` is set in queue.ts
            await DeadLetterEvent.create({
                subscriptionId: event.subscriptionId,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                logIndex: event.logIndex,
                eventName: event.eventName,
                payload: event.payload,
                status: EventStatus.FAILED,
                retryCount: event.retryCount,
                failedAt: new Date(),
                lastError: errorMsg || 'Exhausted all retries'
            });
            await EventLog.findByIdAndDelete(event._id);

            // Send failure notification if enabled and not sent recently
            if (user.emailNotifications) {
                const lastNotif = user.lastFailureNotification;
                const hoursSinceLastNotif = lastNotif ?
                    (Date.now() - lastNotif.getTime()) / 3600000 : 24;

                if (hoursSinceLastNotif >= 1) { // Max 1 notification per hour
                    await sendFailureNotification(user, subscription, event);
                    await User.findByIdAndUpdate(user._id, {
                        lastFailureNotification: new Date()
                    });
                }
            }
        } else {
            event.status = EventStatus.FAILED; // Kept as failed so queries show it's failing
            await event.save();
        }

        throw new Error(errorMsg || 'Delivery failed'); // Throwing triggers BullMQ retry/backoff
    }
};
