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
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    process.exit(1);
}

export const env = _env.data;
