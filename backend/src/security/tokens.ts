import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import crypto from 'crypto';

export interface TokenPayload {
    userId: string;
    companyId?: string;
    role: string;
    isSuperAdmin: boolean;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: '15m',
    });
};

export const generateRefreshToken = (payload: TokenPayload): { token: string; hashedToken: string } => {
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: '30d',
    });

    // Hash the token for database storage
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    return { token: refreshToken, hashedToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
