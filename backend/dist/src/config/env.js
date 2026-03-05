import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().default('5000'),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z.string().length(64), // 32 bytes hex
    CORS_ORIGIN: z.string().default('*'),
});
const envVars = envSchema.safeParse(process.env);
if (!envVars.success) {
    console.error('❌ Invalid environment variables:', envVars.error.format());
    process.exit(1);
}
export const env = envVars.data;
