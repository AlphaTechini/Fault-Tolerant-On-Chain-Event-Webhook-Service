import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Subscription } from '../models';

const subscriptionRoutes: FastifyPluginAsyncZod = async (app) => {

    // Custom error handler for duplicates
    // app.setErrorHandler(...) - usually done globally, but locally for specific logic if needed

    // POST /subscriptions
    app.post('/subscriptions', {
        schema: {
            body: z.object({
                chainId: z.number().int().positive(),
                contractAddress: z.string().startsWith('0x'),
                abi: z.array(z.any()), // basic validation for now, could use strict ABI schema
                webhookUrl: z.string().url(),
            }),
            response: {
                201: z.object({
                    _id: z.string(),
                    chainId: z.number(),
                    contractAddress: z.string(),
                    webhookUrl: z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const { chainId, contractAddress, abi, webhookUrl } = request.body;

        // Check for existing identical subscription?
        // For now, allow duplicates, but in reality we might want to dedupe based on (chain, address, webhook)

        const sub = await Subscription.create({
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
                200: z.array(z.object({
                    _id: z.string(),
                    chainId: z.number(),
                    contractAddress: z.string(),
                    webhookUrl: z.string(),
                    createdAt: z.string().or(z.date()), // Mongoose returns Date object usually
                })),
            },
        },
    }, async (request, reply) => {
        const subs = await Subscription.find().sort({ createdAt: -1 });
        return subs.map(s => ({
            _id: s.id,
            chainId: s.chainId,
            contractAddress: s.contractAddress,
            webhookUrl: s.webhookUrl,
            createdAt: s.createdAt
        })); // Manual map or let serializer handle it if clean
    });
};

export default subscriptionRoutes;
