import { Request, Response } from 'express';
import { generateBackup } from '../services/backupService.js';
import { prisma } from '../src/config/db.js';
import path from 'path';
import fs from 'fs';
import { logAudit } from '../src/utils/auditLogger.js';
import { AuthRequest } from '../src/middleware/auth.js';
import { AppError } from '../src/middleware/errorHandler.js';

export const createBackup = async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { companyId, userId } = authReq.user!;
    const filters = req.body.filters || {};

    const backupId = `BK-${Date.now()}`;
    const job = await prisma.backupJob.create({
        data: {
            companyId: companyId!,
            createdBy: userId as any,
            backupId,
            filters,
            status: 'QUEUED',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    // Start background process
    generateBackup(job.id).catch(err => {
        console.error("Async backup failed:", err);
    });

    await logAudit({
        companyId: companyId!,
        actorId: userId,
        action: 'BACKUP_CREATED',
        targetId: job.id,
        targetType: 'BackupJob',
        details: { backupId, filters },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
    });

    res.status(201).json(job);
};

export const getBackups = async (req: Request, res: Response) => {
    const { companyId } = (req as AuthRequest).user!;
    const backups = await prisma.backupJob.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    res.json(backups);
};

export const getBackupStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyId } = (req as AuthRequest).user!;

    const job = await prisma.backupJob.findUnique({ where: { id: String(id) } });
    if (!job) throw new AppError('Backup job not found', 404);

    if (job.companyId !== companyId) {
        throw new AppError('Access denied', 403);
    }

    res.json(job);
};

export const downloadBackup = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyId, userId } = (req as AuthRequest).user!;

    const job = await prisma.backupJob.findUnique({ where: { id: String(id) } });
    if (!job || job.status !== 'READY') {
        throw new AppError('Backup file not found or not ready', 404);
    }

    if (job.companyId !== companyId) {
        throw new AppError('Access denied', 403);
    }

    if (!job.filePath || !fs.existsSync(job.filePath)) {
        throw new AppError('File no longer exists on server', 404);
    }

    await logAudit({
        companyId: job.companyId,
        actorId: userId,
        action: 'BACKUP_DOWNLOADED',
        targetId: job.id,
        targetType: 'BackupJob',
        details: { backupId: job.backupId },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
    });

    res.download(job.filePath, path.basename(job.filePath));
};

export const deleteBackup = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyId, userId } = (req as AuthRequest).user!;

    const job = await prisma.backupJob.findUnique({ where: { id: String(id) } });
    if (!job) throw new AppError('Backup not found', 404);

    if (job.companyId !== companyId) {
        throw new AppError('Access denied', 403);
    }

    if (job.filePath && fs.existsSync(job.filePath)) {
        fs.unlinkSync(job.filePath);
    }

    await prisma.backupJob.delete({ where: { id: String(id) } });

    await logAudit({
        companyId: job.companyId,
        actorId: userId,
        action: 'BACKUP_DELETED',
        details: { backupId: job.backupId },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
    });

    res.json({ message: "Backup deleted successfully" });
};
