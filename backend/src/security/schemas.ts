import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const registerSchema = z.object({
    companyName: z.string().min(2).max(100),
    ownerName: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/, 'Password must contain at least one uppercase letter').regex(/[0-9]/, 'Password must contain at least one number'),
});

export const refreshTokenSchema = z.string();
