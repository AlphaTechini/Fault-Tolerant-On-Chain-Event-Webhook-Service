import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // JWT
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

    // OAuth - Google
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

    // OAuth - GitHub
    GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
    GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),

    // Frontend URL for redirects
    FRONTEND_URL: z.string().default('http://localhost:5173'),

    // Resend API (for email notifications)
    RESEND_API_KEY: z.string().optional(),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // RPC Configuration (JSON string mapping chainId to array of fallback URLs)
    // E.g., '{"1":["https://mainnet.infura...","https://eth-mainnet.alchemy..."]}'
    RPC_URLS_JSON: z.string().optional().default('{}'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    process.exit(1);
}

export const env = {
    ..._env.data,
    RPC_URLS: (() => {
        try {
            return JSON.parse(_env.data.RPC_URLS_JSON) as Record<number, string[]>;
        } catch (err) {
            console.error("❌ Failed to parse RPC_URLS_JSON. Ensure it is valid JSON.");
            return {} as Record<number, string[]>;
        }
    })(),
};
