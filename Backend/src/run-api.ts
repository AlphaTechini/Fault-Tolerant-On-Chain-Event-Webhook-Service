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
        await connectDB(env.MONGO_URI);

        await app.register(cors, { origin: true });

        await app.register(rateLimit, {
            max: 100,
            timeWindow: '1 minute',
            errorResponseBuilder: () => ({
                statusCode: 429,
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please slow down.',
            }),
        });

        await app.register(underPressure, {
            maxEventLoopDelay: 1000,
            maxHeapUsedBytes: 1000000000,
            maxRssBytes: 1000000000,
            exposeStatusRoute: '/health',
            healthCheck: async () => true
        });

        await app.register(subscriptionRoutes, { prefix: '/api' });
        await app.register(authRoutes);
        await app.register(apiKeyRoutes, { prefix: '/api' });
        await app.register(statsRoutes, { prefix: '/api' });
        await app.register(replayRoutes, { prefix: '/api' });

        app.get('/', async () => ({ status: 'ok', service: 'Contract Webhook API Gateway' }));

        await app.listen({ port: parseInt(env.PORT), host: '0.0.0.0' });
        app.log.info(`🚀 API Gateway running on port ${env.PORT}`);

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
