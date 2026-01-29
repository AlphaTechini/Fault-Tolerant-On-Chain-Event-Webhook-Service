import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
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
    logger: true,
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

        // API Routes
        await app.register(subscriptionRoutes, { prefix: '/api' });
        await app.register(authRoutes);
        await app.register(apiKeyRoutes, { prefix: '/api' });
        await app.register(statsRoutes, { prefix: '/api' });
        await app.register(replayRoutes, { prefix: '/api' });

        // Health check
        app.get('/', async (request, reply) => {
            return { status: 'ok', service: 'Contract Webhook API' };
        });

        // Start background services
        startEventListener();
        startDeliveryService();

        await app.listen({ port: parseInt(env.PORT), host: '0.0.0.0' });
        console.log(`🚀 Server running on port ${env.PORT}`);

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
