import { Request, Response } from 'express';
import { prisma } from '../../src/config/db.js';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ message: 'Company ID is required' });

        // Since Prisma `count` does not support comparing two columns directly (like $expr in Mongo),
        // we can fetch the inventory items or use a raw query if it was SQL, but here we can just
        // rely on findMany for lowStock if dataset isn't huge, or use raw if Prisma relational.
        // For simplicity, we filter in memory or fetch where `quantityOnHand <= reorderLevel` if we had fixed thresholds,
        // but since they are column comparisons, let's fetch IDs to count them.
        const allItems = await prisma.inventoryItem.findMany({
            where: { companyId: String(companyId), isDeleted: false },
            select: { quantityOnHand: true, reorderLevel: true }
        });
        const lowStockCountRaw = allItems.filter(item => item.quantityOnHand <= item.reorderLevel).length;

        const [
            employeeCount,
            inventoryCount,
            totalExpensesAgg,
            // invoiceStats
        ] = await Promise.all([
            prisma.employee.count({ where: { companyId: String(companyId), isDeleted: false } }),
            prisma.inventoryItem.count({ where: { companyId: String(companyId), isDeleted: false } }),
            prisma.expense.aggregate({
                _sum: { amount: true },
                where: { companyId: String(companyId), isDeleted: false }
            }),
            // Invoice.aggregate(...)
        ]);

        const lowStockCount = lowStockCountRaw;
        const totalExpenses = totalExpensesAgg._sum.amount || 0;

        res.status(200).json({
            employees: { total: employeeCount },
            inventory: { totalItems: inventoryCount, lowStock: lowStockCount },
            finance: {
                totalExpenses: totalExpenses,
                // totalRevenue: invoiceStats...
            },
            performance: {
                monthlyGrowth: 12.5, // Mock data for now
                customerSatisfaction: 9.2
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
