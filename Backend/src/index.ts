import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './config';
import { connectDB } from './db';
import subscriptionRoutes from './routes/subscriptions';
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
            origin: true, // simplistic for now
        });

        // ... (inside start function)

        // Routes
        await app.register(subscriptionRoutes);

        app.get('/', async (request, reply) => {
            return { status: 'ok', service: 'Event Webhook Service' };
        });

        // ...

        // Start Services
        startEventListener();
        startDeliveryService();

        await app.listen({ port: parseInt(env.PORT), host: '0.0.0.0' });
        console.log(`Server running on port ${env.PORT}`);

    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
