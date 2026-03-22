import pino from 'pino';
import { env } from '../config';

/**
 * Centralized logger for the application.
 * Uses Pino for high-performance structured logging in JSON format.
 * This is used for background services (listeners, queue workers) where 
 * the Fastify request logger is not available.
 */
const logger = pino({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: {
        service: 'event-webhook-service',
        env: env.NODE_ENV,
    },
    // We keep timestamp enabled for better log correlation in Loki
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    },
});

export default logger;
