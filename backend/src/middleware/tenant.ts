import { AuthRequest } from '../middleware/auth.js';
import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';

export const tenantIsolation = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('Authentication required', 401));
    }

    // If SUPER_ADMIN, they might not have a companyId or they want to access all
    // We'll allow them to pass a companyId in the query or body if they are Super Admin
    if (req.user.isSuperAdmin) {
        const targetCompanyId = req.query.companyId || req.body.companyId;
        if (targetCompanyId) {
            req.user.companyId = targetCompanyId as string;
        }
    }

    if (!req.user.isSuperAdmin && !req.user.companyId) {
        return next(new AppError('Company identification missing', 400));
    }

    next();
};

// Helper for Prisma queries
export const getTenantFilter = (req: AuthRequest) => {
    if (req.user?.isSuperAdmin && !req.user?.companyId) {
        return {};
    }
    return { companyId: req.user?.companyId };
};
