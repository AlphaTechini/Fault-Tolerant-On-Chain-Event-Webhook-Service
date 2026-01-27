"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const models_1 = require("../models");
const subscriptionRoutes = async (app) => {
    // Custom error handler for duplicates
    // app.setErrorHandler(...) - usually done globally, but locally for specific logic if needed
    // POST /subscriptions
    app.post('/subscriptions', {
        schema: {
            body: zod_1.z.object({
                chainId: zod_1.z.number().int().positive(),
                contractAddress: zod_1.z.string().startsWith('0x'),
                abi: zod_1.z.array(zod_1.z.any()), // basic validation for now, could use strict ABI schema
                webhookUrl: zod_1.z.string().url(),
            }),
            response: {
                201: zod_1.z.object({
                    _id: zod_1.z.string(),
                    chainId: zod_1.z.number(),
                    contractAddress: zod_1.z.string(),
                    webhookUrl: zod_1.z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const { chainId, contractAddress, abi, webhookUrl } = request.body;
        // Check for existing identical subscription?
        // For now, allow duplicates, but in reality we might want to dedupe based on (chain, address, webhook)
        const sub = await models_1.Subscription.create({
            chainId,
            contractAddress,
            abi,
            webhookUrl,
        });
        return reply.status(201).send({
            _id: sub.id,
            chainId: sub.chainId,
            contractAddress: sub.contractAddress,
            webhookUrl: sub.webhookUrl,
        });
    });
    // GET /subscriptions
    app.get('/subscriptions', {
        schema: {
            response: {
                200: zod_1.z.array(zod_1.z.object({
                    _id: zod_1.z.string(),
                    chainId: zod_1.z.number(),
                    contractAddress: zod_1.z.string(),
                    webhookUrl: zod_1.z.string(),
                    createdAt: zod_1.z.string().or(zod_1.z.date()), // Mongoose returns Date object usually
                })),
            },
        },
    }, async (request, reply) => {
        const subs = await models_1.Subscription.find().sort({ createdAt: -1 });
        return subs.map(s => ({
            _id: s.id,
            chainId: s.chainId,
            contractAddress: s.contractAddress,
            webhookUrl: s.webhookUrl,
            createdAt: s.createdAt
        })); // Manual map or let serializer handle it if clean
    });
};
exports.default = subscriptionRoutes;
