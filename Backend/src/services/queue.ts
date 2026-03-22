import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config';

// Shared Redis Connection
// Using maxRetriesPerRequest: null is required by BullMQ
export const redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

export const deliveryQueue = new Queue('webhook-delivery', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 15, // Total attempts (Phase 1 + Phase 2)
        backoff: {
            type: 'true-fault-tolerance',
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: true,     // Keep Redis clean, handle dead letters via MongoDB
    },
});

const backoffStrategy = (attemptsMade: number) => {
    const jitter = 0.1; // 10% jitter
    const addJitter = (delay: number) => {
        const variation = delay * jitter;
        const randomVariation = (Math.random() * 2 - 1) * variation;
        return Math.floor(delay + randomVariation);
    };

    // Phase 1: Aggressive (Attempts 1-6)
    // 1s, 2s, 4s, 8s, 16s, 32s
    if (attemptsMade <= 6) {
        return addJitter(Math.pow(2, attemptsMade - 1) * 1000);
    }

    // Phase 2: Relaxed (Attempts 7-15)
    // 1m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 12h
    const relaxedDelays = [
        60000,      // 1m  (Attempt 7)
        300000,     // 5m  (Attempt 8)
        900000,     // 15m (Attempt 9)
        1800000,    // 30m (Attempt 10)
        3600000,    // 1h  (Attempt 11)
        7200000,    // 2h  (Attempt 12)
        14400000,   // 4h  (Attempt 13)
        28800000,   // 8h  (Attempt 14)
        43200000,   // 12h (Attempt 15)
    ];

    const delay = relaxedDelays[attemptsMade - 7] || 43200000;
    return addJitter(delay);
};

export const startDeliveryWorker = (processor: (job: Job) => Promise<void>) => {
    const worker = new Worker('webhook-delivery', processor, {
        connection: redisConnection as any,
        concurrency: 10, // Process 10 webhooks in parallel
        settings: {
            backoffStrategy,
        },
    });

    worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
        console.warn(`⚠️ Job ${job?.id} failed with error: ${err.message}`);
    });

    console.log("🚀 Delivery Worker started...");
    return worker;
};
