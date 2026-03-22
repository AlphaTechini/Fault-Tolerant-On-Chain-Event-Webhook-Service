import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import underPressure from '@fastify/under-pressure';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './config';
import { connectDB } from './db';
import subscriptionRoutes from './routes/subscriptions';
import authRoutes from './routes/auth';
import apiKeyRoutes from './routes/apiKeys';
import statsRoutes from './routes/stats';
import replayRoutes from './routes/replays';
import { startEventListener } from './services/listener';
import { startDeliveryService } from './services/delivery';

const app = Fastify({
    logger: {
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
        formatters: {
            level: (label) => ({ level: label.toUpperCase() }),
        },
    },
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const start = async () => {
    try {
        // Connect to Database
        await connectDB(env.MONGO_URI);

        // Register Plugins
        await app.register(cors, {
            origin: true,
        });

        // Rate limiting - protect API from abuse
        await app.register(rateLimit, {
            max: 100, // 100 requests per window
            timeWindow: '1 minute',
            errorResponseBuilder: () => ({
                statusCode: 429,
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please slow down.',
            }),
        });

        // Health Monitoring Logic
        await app.register(underPressure, {
            maxEventLoopDelay: 1000,
            maxHeapUsedBytes: 1000000000,
            maxRssBytes: 1000000000,
            exposeStatusRoute: {
                url: '/health',
                routeOpts: {
                    logLevel: 'debug'
                } as object,
                routeResponseSchemaOpts: {
                    200: {
                        type: 'object',
                        properties: {
                            status: { type: 'string' },
                            metrics: {
                                type: 'object',
                                properties: {
                                    eventLoopDelay: { type: 'number' },
                                    rssBytes: { type: 'number' },
                                    heapUsedBytes: { type: 'number' },
                                }
                            }
                        }
                    }
                } as object
            },
            healthCheck: async (instance) => {
                // Add custom health checks if needed
                return true;
            }
        });

        // API Routes
        await app.register(subscriptionRoutes, { prefix: '/api' });
        await app.register(authRoutes);
        await app.register(apiKeyRoutes, { prefix: '/api' });
        await app.register(statsRoutes, { prefix: '/api' });
        await app.register(replayRoutes, { prefix: '/api' });

        // Root check
        app.get('/', async (request, reply) => {
            return { status: 'ok', service: 'Contract Webhook API' };
        });

        // Start background services
        startEventListener();
        startDeliveryService();

        await app.listen({ port: parseInt(env.PORT), host: '0.0.0.0' });
        app.log.info(`🚀 Server running on port ${env.PORT}`);

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
