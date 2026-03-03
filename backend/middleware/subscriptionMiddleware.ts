import { Request, Response, NextFunction } from 'express';
import { prisma } from '../src/config/db.js';

export const checkSubscriptionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
        // 1. Identify Company
        // Priority: Header > Body > Query
        const companyId = req.headers['x-company-id'] || req.body?.companyId || req.query.companyId;

        if (!companyId || companyId === 'undefined' || companyId === 'null') {
            return next();
        }

        const company = await prisma.company.findUnique({
            where: { id: String(companyId) }
        });

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // 3. Check for "Overdue Grace Period" state
        const isOverdue = company.subscriptionStatus === 'active' &&
            company.subscriptionEndsAt &&
            new Date(company.subscriptionEndsAt) < new Date();

        if (isOverdue) {
            if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
                return next();
            }

            return res.status(403).json({
                message: 'Subscription Overdue. Your account is in Read-Only mode. Please renew your subscription to make changes.',
                code: 'SUBSCRIPTION_OVERDUE'
            });
        }

        if (company.subscriptionStatus === 'past_due' || company.subscriptionStatus === 'cancelled' || company.subscriptionStatus === 'suspended') {
            if (req.method !== 'GET') {
                return res.status(403).json({ message: 'Subscription Expired/Suspended. Action Denied.' });
            }
        }

        next();
    } catch (error: any) {
        console.error("Subscription Middleware Error:", error);
        res.status(500).json({ message: 'Internal Server Error during subscription check' });
    }
};
