import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../security/tokens.js';
import { AppError } from './errorHandler.js';
import logger from '../utils/logger.js';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        companyId?: string;
        role: string;
        isSuperAdmin: boolean;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        let token = '';

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        const decoded = verifyAccessToken(token);
        req.user = decoded;

        next();
    } catch (error: any) {
        logger.warn({ message: 'Authentication failed', error: error.message, ip: req.ip });
        return next(new AppError('Invalid or expired token', 401));
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
        }

        if (req.user.isSuperAdmin) {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            logger.warn({
                message: 'Permission denied',
                userId: req.user.userId,
                role: req.user.role,
                requiredRoles: roles,
                path: req.path
            });
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    };
};
