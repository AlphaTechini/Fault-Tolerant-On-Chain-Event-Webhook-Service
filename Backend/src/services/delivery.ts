import crypto from 'crypto';
import { EventLog, DeliveryAttempt, Subscription, EventStatus, User, PLAN_LIMITS, PlanTier } from '../models';
import { sendFailureNotification } from './email';

// Retry delays: 1min, 5min, 30min, 2hr, 12hr (as documented)
const RETRY_DELAYS = [60000, 300000, 1800000, 7200000, 43200000];

export const startDeliveryService = async () => {
    console.log("🚀 Starting Delivery Service...");

    // Reset monthly usage at start of each month
    setInterval(resetMonthlyUsage, 3600000); // Check hourly

    setInterval(async () => {
        try {
            await processDeliveryQueue();
        } catch (err) {
            console.error("Error in delivery message loop:", err);
        }
    }, 5000);
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

const processDeliveryQueue = async () => {
    const now = new Date();

    const eventsToProcess = await EventLog.find({
        status: { $in: [EventStatus.PENDING, EventStatus.FAILED] },
        nextRetryAt: { $lte: now },
        retryCount: { $lt: 5 },
    }).limit(50);

    for (const event of eventsToProcess) {
        await processEvent(event);
    }
};

const processEvent = async (event: any) => {
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
        // Don't fail the event, just pause processing - keep it pending
        event.status = EventStatus.PENDING;
        event.nextRetryAt = new Date(Date.now() + 3600000); // Retry in 1 hour
        await event.save();
        return;
    }

    let success = false;
    let responseStatus = 0;
    let responseBody = '';
    let errorMsg = '';

    try {
        const payload = JSON.stringify({
            id: event._id,
            subscriptionId: subscription._id, // Added based on Readme
            chainId: subscription.chainId,
            contractAddress: subscription.contractAddress,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            logIndex: event.logIndex, // Added based on Readme
            eventName: event.eventName,
            args: event.payload, // Renamed from payload to args
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

        const response = await fetch(subscription.webhookUrl, {
            method: 'POST',
            headers,
            body: payload,
            signal: AbortSignal.timeout(30000), // 30s timeout as documented
        });

        responseStatus = response.status;
        responseBody = await response.text();

        if (response.ok) {
            success = true;
        } else {
            errorMsg = `HTTP ${responseStatus}`;
        }
    } catch (err: any) {
        errorMsg = err.message;
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

        if (event.retryCount >= 5) {
            event.status = EventStatus.FAILED;
            console.log(`❌ Event ${event._id} failed permanently after 5 attempts`);

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
            event.status = EventStatus.FAILED;
            // Use documented retry delays
            const delay = RETRY_DELAYS[event.retryCount - 1] || RETRY_DELAYS[4];
            event.nextRetryAt = new Date(Date.now() + delay);
        }

        await event.save();
        console.warn(`⚠️ Event ${event._id} failed delivery. Retry ${event.retryCount}/5`);
    }
};
