import { EventLog, DeliveryAttempt, Subscription, EventStatus } from '../models';

export const startDeliveryService = async () => {
    console.log("🚀 Starting Delivery Service...");
    setInterval(async () => {
        try {
            await processDeliveryQueue();
        } catch (err) {
            console.error("Error in delivery message loop:", err);
        }
    }, 5000); // Check every 5s
};

const processDeliveryQueue = async () => {
    const now = new Date();

    // Find events that are PENDING or FAILED but ready for retry
    const eventsToProcess = await EventLog.find({
        status: { $in: [EventStatus.PENDING, EventStatus.FAILED] },
        nextRetryAt: { $lte: now },
        retryCount: { $lt: 5 }, // Max 5 retries
    }).limit(50); // Batch size

    for (const event of eventsToProcess) {
        await processEvent(event);
    }
};

const processEvent = async (event: any) => {
    // Lock event (optimistic locking could be better, here simple status update)
    event.status = EventStatus.PROCESSING;
    await event.save();

    const subscription = await Subscription.findById(event.subscriptionId);
    if (!subscription) {
        console.error(`Subscription ${event.subscriptionId} not found for event ${event._id}`);
        event.status = EventStatus.FAILED; // Fatal
        await event.save();
        return;
    }

    let success = false;
    let responseStatus = 0;
    let responseBody = '';
    let errorMsg = '';

    try {
        const response = await fetch(subscription.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: event._id,
                eventName: event.eventName,
                chainId: subscription.chainId,
                contractAddress: subscription.contractAddress,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                payload: event.payload,
                timestamp: new Date().toISOString(),
            }),
            signal: AbortSignal.timeout(10000), // 10s timeout
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
        responseBody: responseBody.substring(0, 1000), // limit size
        success,
        error: errorMsg,
    });

    // Update Event Status
    if (success) {
        event.status = EventStatus.DELIVERED;
        await event.save();
        console.log(`✅ Event ${event._id} delivered to ${subscription.webhookUrl}`);
    } else {
        event.retryCount += 1;
        if (event.retryCount >= 5) {
            event.status = EventStatus.FAILED;
            console.log(`❌ Event ${event._id} failed permanently after 5 attempts`);
        } else {
            event.status = EventStatus.FAILED; // Stays failed until next retry picks it up? 
            // Actually we query for FAILED status, so that works.
            // But we need to set nextRetryAt (exponential backoff)
            const delay = Math.pow(2, event.retryCount) * 1000; // 2s, 4s, 8s...
            event.nextRetryAt = new Date(Date.now() + delay);
        }
        await event.save();
        console.warn(`⚠️ Event ${event._id} failed delivery. Retry ${event.retryCount}/5 in ${event.nextRetryAt}`);
    }
};
