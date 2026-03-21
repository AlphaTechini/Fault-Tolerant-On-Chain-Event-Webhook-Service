import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config';
import { ApiKey } from '../models';

export interface AuthenticatedRequest extends FastifyRequest {
    user: {
        id: string;
        email: string;
    };
}

// Hash API key for lookup
const hashApiKey = (key: string): string => {
    return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Auth middleware supporting both JWT (Bearer token) and API Key authentication
 * - JWT: Authorization: Bearer <jwt_token>
 * - API Key: Authorization: Bearer <api_key> (starts with sk_live_)
 */
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7);

    // Check if it's an API key (starts with sk_live_)
    if (token.startsWith('sk_live_')) {
        const keyHash = hashApiKey(token);
        const apiKey = await ApiKey.findOne({ keyHash });

        if (!apiKey) {
            return reply.status(401).send({ error: 'Invalid API key' });
        }

        // Update lastUsedAt
        apiKey.lastUsedAt = new Date();
        await apiKey.save();

        (request as AuthenticatedRequest).user = {
            id: apiKey.userId.toString(),
            email: '', // API keys don't have email context
        };
        return;
    }

    // Otherwise treat as JWT
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
        (request as AuthenticatedRequest).user = decoded;
    } catch (error) {
        return reply.status(401).send({ error: 'Invalid or expired token' });
    }
};
