import { prisma } from '../config/db.js';
import logger from './logger.js';

interface AuditLogData {
    companyId?: string;
    actorId: string;
    action: string;
    targetId?: string;
    targetType?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    path?: string;
    method?: string;
    statusCode?: number;
}

export const logAudit = async (data: AuditLogData) => {
    try {
        // @ts-ignore - Prisma types might not have updated yet in IDE
        await prisma.auditLog.create({
            data: {
                companyId: data.companyId,
                actorId: data.actorId,
                action: data.action,
                targetId: data.targetId,
                targetType: data.targetType,
                details: data.details,
                ip: data.ip,
                userAgent: data.userAgent,
                path: data.path,
                method: data.method,
                statusCode: data.statusCode,
            },
        });
    } catch (error) {
        logger.error({ msg: 'Failed to save audit log to database', error, data });
    }
};
