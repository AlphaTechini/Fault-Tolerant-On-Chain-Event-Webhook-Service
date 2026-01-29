import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import crypto from 'crypto';
import { Subscription, EventLog, DeliveryAttempt, User, PLAN_LIMITS, PlanTier } from '../models';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// Generate a webhook secret
const generateWebhookSecret = (): string => {
    return `whsec_${crypto.randomBytes(24).toString('base64url')}`;
};

const subscriptionRoutes: FastifyPluginAsyncZod = async (app) => {

    // Apply auth middleware to all routes in this plugin
    app.addHook('preHandler', authMiddleware);

    // POST /subscriptions - Create new subscription
    app.post('/subscriptions', {
        schema: {
            body: z.object({
                chainId: z.number().int().positive(),
                contractAddress: z.string().startsWith('0x'),
                abi: z.array(z.any()),
                webhookUrl: z.string().url(),
                eventFilters: z.array(z.string()).optional(),
                enableSignature: z.boolean().optional().default(true),
            }),
            response: {
                201: z.object({
                    _id: z.string(),
                    chainId: z.number(),
                    contractAddress: z.string(),
                    webhookUrl: z.string(),
                    webhookSecret: z.string().nullable(),
                    status: z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const { chainId, contractAddress, abi, webhookUrl, eventFilters, enableSignature } = request.body;
        const userId = (request as AuthenticatedRequest).user.id;

        // Check plan limit for subscriptions
        const user = await User.findById(userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        const subscriptionLimit = PLAN_LIMITS[user.plan as PlanTier].subscriptions;
        const currentCount = await Subscription.countDocuments({ userId });
        if (currentCount >= subscriptionLimit) {
            return reply.status(403).send({
                error: `Plan limit reached. ${user.plan} plan allows ${subscriptionLimit} subscriptions.`
            });
        }

        // Generate webhook secret if signature is enabled
        const webhookSecret = enableSignature ? generateWebhookSecret() : undefined;

        const sub = await Subscription.create({
            userId,
            chainId,
            contractAddress,
            abi,
            webhookUrl,
            webhookSecret,
            eventFilters: eventFilters || [],
        });

        // Return secret ONLY on creation (user must save it)
        return reply.status(201).send({
            _id: sub.id,
            chainId: sub.chainId,
            contractAddress: sub.contractAddress,
            webhookUrl: sub.webhookUrl,
            webhookSecret: webhookSecret || null,
            status: sub.status,
        });
    });

    // GET /subscriptions - List user's subscriptions
    app.get('/subscriptions', {
        schema: {
            response: {
                200: z.array(z.object({
                    _id: z.string(),
                    chainId: z.number(),
                    contractAddress: z.string(),
                    webhookUrl: z.string(),
                    eventFilters: z.array(z.string()),
                    status: z.string(),
                    lastProcessedBlock: z.number(),
                    createdAt: z.string().or(z.date()),
                })),
            },
        },
    }, async (request, reply) => {
        const userId = (request as AuthenticatedRequest).user.id;

        const subs = await Subscription.find({ userId }).sort({ createdAt: -1 });
        return subs.map(s => ({
            _id: s.id,
            chainId: s.chainId,
            contractAddress: s.contractAddress,
            webhookUrl: s.webhookUrl,
            eventFilters: s.eventFilters || [],
            status: s.status,
            lastProcessedBlock: s.lastProcessedBlock,
            createdAt: s.createdAt,
        }));
    });

    // GET /subscriptions/:id - Get single subscription
    app.get('/subscriptions/:id', {
        schema: {
            params: z.object({ id: z.string() }),
        },
    }, async (request, reply) => {
        const userId = (request as AuthenticatedRequest).user.id;
        const { id } = request.params;

        const sub = await Subscription.findOne({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }

        return {
            _id: sub.id,
            chainId: sub.chainId,
            contractAddress: sub.contractAddress,
            webhookUrl: sub.webhookUrl,
            eventFilters: sub.eventFilters || [],
            status: sub.status,
            lastProcessedBlock: sub.lastProcessedBlock,
            createdAt: sub.createdAt,
        };
    });

    // PATCH /subscriptions/:id - Update subscription
    app.patch('/subscriptions/:id', {
        schema: {
            params: z.object({ id: z.string() }),
            body: z.object({
                webhookUrl: z.string().url().optional(),
                eventFilters: z.array(z.string()).optional(),
                status: z.enum(['active', 'paused']).optional(),
            }),
        },
    }, async (request, reply) => {
        const userId = (request as AuthenticatedRequest).user.id;
        const { id } = request.params;

        const sub = await Subscription.findOne({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }

        const { webhookUrl, eventFilters, status } = request.body;
        if (webhookUrl) sub.webhookUrl = webhookUrl;
        if (eventFilters) sub.eventFilters = eventFilters;
        if (status) sub.status = status;

        await sub.save();

        return {
            _id: sub.id,
            chainId: sub.chainId,
            contractAddress: sub.contractAddress,
            webhookUrl: sub.webhookUrl,
            eventFilters: sub.eventFilters || [],
            status: sub.status,
        };
    });

    // DELETE /subscriptions/:id - Delete subscription
    app.delete('/subscriptions/:id', {
        schema: {
            params: z.object({ id: z.string() }),
        },
    }, async (request, reply) => {
        const userId = (request as AuthenticatedRequest).user.id;
        const { id } = request.params;

        const sub = await Subscription.findOneAndDelete({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }

        return { message: 'Subscription deleted successfully' };
    });

    // GET /subscriptions/:id/events - Get events for a subscription
    app.get('/subscriptions/:id/events', {
        schema: {
            params: z.object({ id: z.string() }),
            querystring: z.object({
                limit: z.string().optional().transform(v => parseInt(v || '50')),
                status: z.enum(['PENDING', 'PROCESSING', 'DELIVERED', 'FAILED']).optional(),
            }),
        },
    }, async (request, reply) => {
        const userId = (request as AuthenticatedRequest).user.id;
        const { id } = request.params;
        const { limit, status } = request.query;

        // Verify ownership
        const sub = await Subscription.findOne({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }

        const query: any = { subscriptionId: id };
        if (status) query.status = status;

        const events = await EventLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        return events.map(e => ({
            _id: e.id,
            eventName: e.eventName,
            blockNumber: e.blockNumber,
            transactionHash: e.transactionHash,
            status: e.status,
            retryCount: e.retryCount,
            createdAt: e.createdAt,
        }));
    });

    // GET /subscriptions/:id/events/:eventId/attempts - Get delivery attempts
    app.get('/subscriptions/:id/events/:eventId/attempts', {
        schema: {
            params: z.object({
                id: z.string(),
                eventId: z.string(),
            }),
        },
    }, async (request, reply) => {
        const userId = (request as AuthenticatedRequest).user.id;
        const { id, eventId } = request.params;

        // Verify ownership
        const sub = await Subscription.findOne({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }

        const attempts = await DeliveryAttempt.find({ eventLogId: eventId })
            .sort({ timestamp: -1 });

        return attempts.map(a => ({
            _id: a.id,
            responseStatus: a.responseStatus,
            success: a.success,
            error: a.error,
            timestamp: a.timestamp,
        }));
    });

    // POST /subscriptions/:id/events/:eventId/replay - Retry a failed event
    app.post('/subscriptions/:id/events/:eventId/replay', {
        schema: {
            params: z.object({
                id: z.string(),
                eventId: z.string(),
            }),
        },
    }, async (request, reply) => {
        const userId = (request as AuthenticatedRequest).user.id;
        const { id, eventId } = request.params;

        // Verify ownership
        const sub = await Subscription.findOne({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }

        const event = await EventLog.findOne({ _id: eventId, subscriptionId: id });
        if (!event) {
            return reply.status(404).send({ error: 'Event not found' });
        }

        // Reset event for retry
        event.status = 'PENDING';
        event.retryCount = 0;
        event.nextRetryAt = new Date();
        await event.save();

        return { message: 'Event queued for replay', eventId: event.id };
    });
};

export default subscriptionRoutes;
