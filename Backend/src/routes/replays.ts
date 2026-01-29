import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Subscription, EventLog, DeliveryAttempt } from '../models';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const replayRoutes: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', authMiddleware);

    // POST /replays - Time-range replays
    app.post('/replays', {
        schema: {
            body: z.object({
                subscriptionId: z.string(),
                fromTimestamp: z.string().datetime(),
                toTimestamp: z.string().datetime(),
            }),
            response: {
                200: z.object({
                    message: z.string(),
                    count: z.number(),
                }),
            },
        },
    }, async (request, reply) => {
        const { subscriptionId, fromTimestamp, toTimestamp } = request.body;
        const userId = (request as AuthenticatedRequest).user.id; // Corrected: user.id property

        // Verify ownership
        const sub = await Subscription.findOne({ _id: subscriptionId, userId });
        if (!sub) {
            return reply.status(404).send({ error: 'Subscription not found' });
        }

        const stats = await EventLog.updateMany(
            {
                subscriptionId,
                createdAt: {
                    $gte: new Date(fromTimestamp),
                    $lte: new Date(toTimestamp),
                },
            },
            {
                $set: {
                    status: 'PENDING',
                    retryCount: 0,
                    nextRetryAt: new Date(),
                }
            }
        );

        return {
            message: 'Replay started',
            count: stats.modifiedCount,
        };
    });
};

export default replayRoutes;
