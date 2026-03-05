import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import crypto from 'crypto';
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: '15m',
    });
};
export const generateRefreshToken = (payload) => {
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: '30d',
    });
    // Hash the token for database storage
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    return { token: refreshToken, hashedToken };
};
export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.JWT_SECRET);
};
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
