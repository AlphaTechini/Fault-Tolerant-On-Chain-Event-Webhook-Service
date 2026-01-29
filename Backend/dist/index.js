"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const config_1 = require("./config");
const db_1 = require("./db");
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const auth_1 = __importDefault(require("./routes/auth"));
const apiKeys_1 = __importDefault(require("./routes/apiKeys"));
const stats_1 = __importDefault(require("./routes/stats"));
const replays_1 = __importDefault(require("./routes/replays"));
const listener_1 = require("./services/listener");
const delivery_1 = require("./services/delivery");
const app = (0, fastify_1.default)({
    logger: true,
}).withTypeProvider();
app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
const start = async () => {
    try {
        // Connect to Database
        await (0, db_1.connectDB)(config_1.env.MONGO_URI);
        // Register Plugins
        await app.register(cors_1.default, {
            origin: true,
        });
        // Rate limiting - protect API from abuse
        await app.register(rate_limit_1.default, {
            max: 100, // 100 requests per window
            timeWindow: '1 minute',
            errorResponseBuilder: () => ({
                statusCode: 429,
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please slow down.',
            }),
        });
        // API Routes
        await app.register(subscriptions_1.default, { prefix: '/api' });
        await app.register(auth_1.default);
        await app.register(apiKeys_1.default, { prefix: '/api' });
        await app.register(stats_1.default, { prefix: '/api' });
        await app.register(replays_1.default, { prefix: '/api' });
        // Health check
        app.get('/', async (request, reply) => {
            return { status: 'ok', service: 'Contract Webhook API' };
        });
        // Start background services
        (0, listener_1.startEventListener)();
        (0, delivery_1.startDeliveryService)();
        await app.listen({ port: parseInt(config_1.env.PORT), host: '0.0.0.0' });
        console.log(`🚀 Server running on port ${config_1.env.PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
