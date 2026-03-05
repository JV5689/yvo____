import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { stringify } from 'csv-stringify/sync';
import { prisma } from '../src/config/db.js';

const MODULE_MODELS: Record<string, any> = {
    users: 'user',
    employees: 'employee',
    invoices: 'invoice',
    expenses: 'expense',
    customers: 'customer',
    inventory: 'inventoryItem',
    leaves: 'leaveRequest',
    payroll: 'salaryRecord',
    work_reports: 'workReport',
    calendar: 'calendarEvent',
    broadcast_groups: 'broadcastGroup',
    broadcast_messages: 'broadcastMessage'
};

const SENSITIVE_FIELDS = ['password', 'passwordHash', 'refreshToken', 'googleId', 'apiKey'];
const PII_FIELDS = ['email', 'phone', 'address', 'fullName', 'firstName', 'lastName'];

const formatValueForHuman = (key: string, value: any): any => {
    if (!value && value !== 0 && value !== false) return '';

    if (value instanceof Date) {
        return value.toLocaleString();
    }
    if ((key.toLowerCase().endsWith('at') || key.toLowerCase().endsWith('date')) && typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleString();
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
        const nameCandidates = [
            value.name,
            value.fullName,
            (value.firstName || value.lastName) ? `${value.firstName || ''} ${value.lastName || ''}`.trim() : null,
            value.title,
            value.sku ? `${value.sku} - ${value.name || ''}` : null,
            value.email,
            value.backupId
        ];

        const winner = nameCandidates.find(c => c && typeof c === 'string');
        if (winner) return winner;

        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return value.map(item => {
            if (typeof item === 'object') {
                if (item.inventoryId || item.description) {
                    const desc = (item.inventory?.name || item.description || 'Item').trim();
                    const qty = item.quantity || 0;
                    const price = item.price || 0;
                    const total = item.total || (qty * price);
                    return `${desc} (${qty} x ${price} = ${total})`;
                }
                return formatValueForHuman('array_item', item);
            }
            return item;
        }).join('; ');
    }

    return value;
};

export const generateBackup = async (jobId: string) => {
    const job = await prisma.backupJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    const company = await prisma.company.findUnique({ where: { id: job.companyId } });
    if (!company) {
        await prisma.backupJob.update({
            where: { id: jobId },
            data: { status: 'FAILED', error: 'Company not found' }
        });
        return;
    }

    try {
        await prisma.backupJob.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' }
        });

        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `YVO_BACKUP_${company.name.replace(/\s+/g, '_')}_${timestamp}_${job.backupId}.zip`;
        const tempDir = path.join(process.cwd(), 'temp', 'backups');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const filePath = path.join(tempDir, fileName);
        const output = fs.createWriteStream(filePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async () => {
            await prisma.backupJob.update({
                where: { id: job.id },
                data: {
                    status: 'READY',
                    progress: 100,
                    filePath: filePath,
                    fileSize: archive.pointer()
                }
            });

            await prisma.auditLog.create({
                data: {
                    companyId: company.id,
                    actorId: String(job.createdBy) || 'system',
                    action: 'BACKUP_READY',
                    targetId: job.id,
                    targetType: 'BackupJob',
                    details: { backupId: job.backupId, size: archive.pointer() }
                }
            });
        });

        archive.on('error', async (err: any) => {
            throw err;
        });

        archive.pipe(output);

        const manifest = {
            backupId: job.backupId,
            companyId: company.id,
            companyName: company.name,
            createdAt: job.createdAt || new Date(),
            createdBy: job.createdBy,
            includedModules: (job.filters as any)?.modules,
            includesFiles: (job.filters as any)?.includeFiles,
            piiIncluded: (job.filters as any)?.includePII,
            schemaVersion: '2.0.0 (Prisma)'
        };
        const readmeContent = `YVO Data Export - README\n\nYour company data exports.\n\nGenerated on: ${new Date(job.createdAt || Date.now()).toLocaleString()}`;
        archive.append(readmeContent, { name: 'README.txt' });
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest/manifest.json' });

        const modulesToExport = (job.filters as any)?.modules && (job.filters as any).modules.length > 0
            ? (job.filters as any).modules
            : Object.keys(MODULE_MODELS);

        let processedModules = 0;
        const totalModules = modulesToExport.length;
        const updatedRecordCounts: any = typeof job.recordCounts === 'object' && job.recordCounts !== null && !Array.isArray(job.recordCounts) ? { ...job.recordCounts } : {};

        for (const moduleName of modulesToExport) {
            const modelDelegateString = MODULE_MODELS[moduleName];
            if (!modelDelegateString) continue;

            await prisma.backupJob.update({
                where: { id: jobId },
                data: {
                    currentModule: moduleName,
                    progress: Math.round((processedModules / totalModules) * 100)
                }
            });

            let query: any = { companyId: company.id };

            if ((job.filters as any)?.dateRange?.start || (job.filters as any)?.dateRange?.end) {
                const dateField = getDateFieldForModule(moduleName);
                query[dateField] = {};
                if ((job.filters as any).dateRange.start) query[dateField].gte = new Date((job.filters as any).dateRange.start);
                if ((job.filters as any).dateRange.end) query[dateField].lte = new Date((job.filters as any).dateRange.end);
            }

            if (moduleName === 'users') {
                query = { memberships: { some: { companyId: company.id } } };
            }

            let includeArgs: any = undefined;
            if (moduleName === 'invoices') {
                includeArgs = { customer: true, items: { include: { inventory: true } } };
            } else if (moduleName === 'employees') {
                includeArgs = { company: true };
            } else if (moduleName === 'expenses' || moduleName === 'customers' || moduleName === 'inventory') {
                includeArgs = { company: true };
            } else if (moduleName === 'leaves' || moduleName === 'payroll' || moduleName === 'work_reports') {
                includeArgs = { employee: true };
            }

            const modelDelegate = (prisma as any)[modelDelegateString];
            const rawRecords = await modelDelegate.findMany({
                where: query,
                include: includeArgs
            });

            const records: any[] = [];
            let count = 0;

            for (const doc of rawRecords) {
                const data = { ...doc };

                SENSITIVE_FIELDS.forEach(f => delete data[f]);

                if (!(job.filters as any)?.includePII) {
                    PII_FIELDS.forEach(f => {
                        if (data[f]) data[f] = maskPII(data[f], f);
                    });
                }

                records.push(data);
                count++;
            }

            if (records.length > 0) {
                archive.append(JSON.stringify(records, null, 2), { name: `data/${moduleName}/records.json` });

                const csvRecords = records.map(r => {
                    const humanRow: any = {};
                    for (const [key, value] of Object.entries(r)) {
                        humanRow[key] = formatValueForHuman(key, value);
                    }
                    return humanRow;
                });

                const csvData = stringify(csvRecords, { header: true });
                archive.append(csvData, { name: `data/${moduleName}/records.csv` });
            }

            const summary = {
                module: moduleName,
                recordCount: count,
                filtersApplied: query
            };
            archive.append(JSON.stringify(summary, null, 2), { name: `data/${moduleName}/summary.json` });

            updatedRecordCounts[moduleName] = count;
            processedModules++;

            await prisma.backupJob.update({
                where: { id: jobId },
                data: { recordCounts: updatedRecordCounts }
            });
        }

        if ((job.filters as any)?.includeFiles) {
            const filesIndex: any[] = [];
            archive.append(JSON.stringify(filesIndex, null, 2), { name: 'files/files_index.json' });
        }

        await archive.finalize();

    } catch (error: any) {
        console.error("Backup generation failed:", error);
        await prisma.backupJob.update({
            where: { id: jobId },
            data: { status: 'FAILED', error: error.message }
        });

        await prisma.auditLog.create({
            data: {
                companyId: company.id,
                actorId: String(job.createdBy) || 'system',
                action: 'BACKUP_FAILED',
                targetId: job.id,
                targetType: 'BackupJob',
                details: { error: error.message }
            }
        });
    }
};

const getDateFieldForModule = (module: string): string => {
    const mapping: Record<string, string> = {
        expenses: 'date',
        invoices: 'date',
        leaves: 'startDate',
        payroll: 'paymentDate',
        work_reports: 'date'
    };
    return mapping[module] || 'createdAt';
};

const maskPII = (value: any, field: string) => {
    if (typeof value !== 'string') return value;
    if (field === 'email') return value.replace(/(?<=.{2}).(?=[^@]*?@)/g, '*');
    if (field === 'phone') return value.replace(/.(?=.{4})/g, '*');
    return '***';
};
