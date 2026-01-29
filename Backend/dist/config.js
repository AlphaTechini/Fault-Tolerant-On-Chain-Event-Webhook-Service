"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3000'),
    MONGO_URI: zod_1.z.string().min(1, "MONGO_URI is required"),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // JWT
    JWT_SECRET: zod_1.z.string().min(1, "JWT_SECRET is required"),
    // OAuth - Google
    GOOGLE_CLIENT_ID: zod_1.z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
    // OAuth - GitHub
    GITHUB_CLIENT_ID: zod_1.z.string().min(1, "GITHUB_CLIENT_ID is required"),
    GITHUB_CLIENT_SECRET: zod_1.z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
    // Frontend URL for redirects
    FRONTEND_URL: zod_1.z.string().default('http://localhost:5173'),
    // Resend API (for email notifications)
    RESEND_API_KEY: zod_1.z.string().optional(),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    process.exit(1);
}
exports.env = _env.data;
