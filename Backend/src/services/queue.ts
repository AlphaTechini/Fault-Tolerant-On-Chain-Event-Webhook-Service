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
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 60000, // Starts at 1 min delay, goes to 2m, 4m, 8m, 16m
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: true,     // Keep Redis clean, handle dead letters via MongoDB
    },
});

export const startDeliveryWorker = (processor: (job: Job) => Promise<void>) => {
    const worker = new Worker('webhook-delivery', processor, {
        connection: redisConnection as any,
        concurrency: 10, // Process 10 webhooks in parallel
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
