"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
// Generate a webhook secret
const generateWebhookSecret = () => {
    return `whsec_${crypto_1.default.randomBytes(24).toString('base64url')}`;
};
const subscriptionRoutes = async (app) => {
    // Apply auth middleware to all routes in this plugin
    app.addHook('preHandler', auth_1.authMiddleware);
    // POST /subscriptions - Create new subscription
    app.post('/subscriptions', {
        schema: {
            body: zod_1.z.object({
                chainId: zod_1.z.number().int().positive(),
                contractAddress: zod_1.z.string().startsWith('0x'),
                abi: zod_1.z.array(zod_1.z.any()),
                webhookUrl: zod_1.z.string().url(),
                eventFilters: zod_1.z.array(zod_1.z.string()).optional(),
                enableSignature: zod_1.z.boolean().optional().default(true),
            }),
            response: {
                201: zod_1.z.object({
                    _id: zod_1.z.string(),
                    chainId: zod_1.z.number(),
                    contractAddress: zod_1.z.string(),
                    webhookUrl: zod_1.z.string(),
                    webhookSecret: zod_1.z.string().nullable(),
                    status: zod_1.z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const { chainId, contractAddress, abi, webhookUrl, eventFilters, enableSignature } = request.body;
        const userId = request.user.id;
        // Check plan limit for subscriptions
        const user = await models_1.User.findById(userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        const subscriptionLimit = models_1.PLAN_LIMITS[user.plan].subscriptions;
        const currentCount = await models_1.Subscription.countDocuments({ userId });
        if (currentCount >= subscriptionLimit) {
            return reply.status(403).send({
                error: `Plan limit reached. ${user.plan} plan allows ${subscriptionLimit} subscriptions.`
            });
        }
        // Generate webhook secret if signature is enabled
        const webhookSecret = enableSignature ? generateWebhookSecret() : undefined;
        const sub = await models_1.Subscription.create({
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
                200: zod_1.z.array(zod_1.z.object({
                    _id: zod_1.z.string(),
                    chainId: zod_1.z.number(),
                    contractAddress: zod_1.z.string(),
                    webhookUrl: zod_1.z.string(),
                    eventFilters: zod_1.z.array(zod_1.z.string()),
                    status: zod_1.z.string(),
                    lastProcessedBlock: zod_1.z.number(),
                    createdAt: zod_1.z.string().or(zod_1.z.date()),
                })),
            },
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const subs = await models_1.Subscription.find({ userId }).sort({ createdAt: -1 });
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
            params: zod_1.z.object({ id: zod_1.z.string() }),
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const { id } = request.params;
        const sub = await models_1.Subscription.findOne({ _id: id, userId });
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
            params: zod_1.z.object({ id: zod_1.z.string() }),
            body: zod_1.z.object({
                webhookUrl: zod_1.z.string().url().optional(),
                eventFilters: zod_1.z.array(zod_1.z.string()).optional(),
                status: zod_1.z.enum(['active', 'paused']).optional(),
            }),
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const { id } = request.params;
        const sub = await models_1.Subscription.findOne({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }
        const { webhookUrl, eventFilters, status } = request.body;
        if (webhookUrl)
            sub.webhookUrl = webhookUrl;
        if (eventFilters)
            sub.eventFilters = eventFilters;
        if (status)
            sub.status = status;
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
            params: zod_1.z.object({ id: zod_1.z.string() }),
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const { id } = request.params;
        const sub = await models_1.Subscription.findOneAndDelete({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }
        return { message: 'Subscription deleted successfully' };
    });
    // GET /subscriptions/:id/events - Get events for a subscription
    app.get('/subscriptions/:id/events', {
        schema: {
            params: zod_1.z.object({ id: zod_1.z.string() }),
            querystring: zod_1.z.object({
                limit: zod_1.z.string().optional().transform(v => parseInt(v || '50')),
                status: zod_1.z.enum(['PENDING', 'PROCESSING', 'DELIVERED', 'FAILED']).optional(),
            }),
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const { id } = request.params;
        const { limit, status } = request.query;
        // Verify ownership
        const sub = await models_1.Subscription.findOne({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }
        const query = { subscriptionId: id };
        if (status)
            query.status = status;
        const events = await models_1.EventLog.find(query)
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
            params: zod_1.z.object({
                id: zod_1.z.string(),
                eventId: zod_1.z.string(),
            }),
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const { id, eventId } = request.params;
        // Verify ownership
        const sub = await models_1.Subscription.findOne({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }
        const attempts = await models_1.DeliveryAttempt.find({ eventLogId: eventId })
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
            params: zod_1.z.object({
                id: zod_1.z.string(),
                eventId: zod_1.z.string(),
            }),
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const { id, eventId } = request.params;
        // Verify ownership
        const sub = await models_1.Subscription.findOne({ _id: id, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }
        const event = await models_1.EventLog.findOne({ _id: eventId, subscriptionId: id });
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
exports.default = subscriptionRoutes;
