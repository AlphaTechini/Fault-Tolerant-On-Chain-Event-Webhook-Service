"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const config_1 = require("./config");
const db_1 = require("./db");
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
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
            origin: true, // simplistic for now
        });
        // ... (inside start function)
        // Routes
        await app.register(subscriptions_1.default);
        app.get('/', async (request, reply) => {
            return { status: 'ok', service: 'Event Webhook Service' };
        });
        // ...
        // Start Services
        (0, listener_1.startEventListener)();
        (0, delivery_1.startDeliveryService)();
        await app.listen({ port: parseInt(config_1.env.PORT), host: '0.0.0.0' });
        console.log(`Server running on port ${config_1.env.PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
