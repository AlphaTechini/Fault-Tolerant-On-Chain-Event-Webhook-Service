import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Subscription, EventLog, EventStatus, User, PLAN_LIMITS, PlanTier } from '../models';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const statsRoutes: FastifyPluginAsyncZod = async (app) => {

    app.addHook('preHandler', authMiddleware);

    // GET /stats - Dashboard statistics
    app.get('/stats', {
        schema: {
            response: {
                200: z.object({
                    user: z.object({
                        name: z.string(),
                        email: z.string(),
                        plan: z.string(),
                        eventsThisMonth: z.number(),
                        eventsLimit: z.number(),
                        usagePercent: z.number(),
                    }),
                    stats: z.object({
                        totalSubscriptions: z.number(),
                        activeSubscriptions: z.number(),
                        eventsToday: z.number(),
                        eventsThisWeek: z.number(),
                        deliverySuccessRate: z.number(),
                        failedEvents: z.number(),
                    }),
                    recentEvents: z.array(z.object({
                        _id: z.string(),
                        eventName: z.string(),
                        status: z.string(),
                        createdAt: z.string().or(z.date()),
                        subscriptionId: z.string(),
                    })),
                }),
            },
        },
    }, async (request, reply) => {
        const userId = (request as AuthenticatedRequest).user.id;

        // Get user info
        const user = await User.findById(userId);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        const planLimit = PLAN_LIMITS[user.plan as PlanTier].eventsPerMonth;

        // Get subscription stats
        const totalSubscriptions = await Subscription.countDocuments({ userId });
        const activeSubscriptions = await Subscription.countDocuments({ userId, status: 'active' });

        // Get user's subscription IDs
        const subscriptionIds = await Subscription.find({ userId }).select('_id');
        const subIds = subscriptionIds.map(s => s._id);

        // Time boundaries
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);

        // Event stats
        const eventsToday = await EventLog.countDocuments({
            subscriptionId: { $in: subIds },
            createdAt: { $gte: startOfToday },
        });

        const eventsThisWeek = await EventLog.countDocuments({
            subscriptionId: { $in: subIds },
            createdAt: { $gte: startOfWeek },
        });

        // Delivery success rate (last 7 days)
        const deliveredCount = await EventLog.countDocuments({
            subscriptionId: { $in: subIds },
            status: EventStatus.DELIVERED,
            createdAt: { $gte: startOfWeek },
        });

        const totalEventsWeek = await EventLog.countDocuments({
            subscriptionId: { $in: subIds },
            createdAt: { $gte: startOfWeek },
        });

        const deliverySuccessRate = totalEventsWeek > 0
            ? Math.round((deliveredCount / totalEventsWeek) * 1000) / 10
            : 100;

        // Failed events count
        const failedEvents = await EventLog.countDocuments({
            subscriptionId: { $in: subIds },
            status: EventStatus.FAILED,
        });

        // Recent events
        const recentEvents = await EventLog.find({
            subscriptionId: { $in: subIds },
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('_id eventName status createdAt subscriptionId');

        return {
            user: {
                name: user.name,
                email: user.email,
                plan: user.plan,
                eventsThisMonth: user.eventsThisMonth,
                eventsLimit: planLimit,
                usagePercent: Math.round((user.eventsThisMonth / planLimit) * 100),
            },
            stats: {
                totalSubscriptions,
                activeSubscriptions,
                eventsToday,
                eventsThisWeek,
                deliverySuccessRate,
                failedEvents,
            },
            recentEvents: recentEvents.map(e => ({
                _id: e._id.toString(),
                eventName: e.eventName,
                status: e.status,
                createdAt: e.createdAt,
                subscriptionId: e.subscriptionId.toString(),
            })),
        };
    });
};

export default statsRoutes;
