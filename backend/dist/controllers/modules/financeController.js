import { prisma } from '../../src/config/db.js';
export const getDashboardStats = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ message: 'Company ID required' });
        const companyObjectId = String(companyId);
        // Total Invoiced
        const invoices = await prisma.invoice.aggregate({
            _sum: {
                grandTotal: true
            },
            where: {
                companyId: companyObjectId,
                isDeleted: false,
                status: {
                    notIn: ['DRAFT', 'CANCELLED']
                }
            }
        });
        // Total Received
        const payments = await prisma.payment.aggregate({
            _sum: {
                amount: true
            },
            where: {
                companyId: companyObjectId,
                isDeleted: false
            }
        });
        // Total Expenses (excluding Payroll category to avoid double-counting if mirrored)
        const expenses = await prisma.expense.aggregate({
            _sum: {
                amount: true
            },
            where: {
                companyId: companyObjectId,
                isDeleted: false,
                category: { not: 'Payroll' }
            }
        });
        // Total Salary Records
        const salaries = await prisma.salaryRecord.aggregate({
            _sum: {
                amount: true
            },
            where: {
                companyId: companyObjectId,
                status: { in: ['Paid', 'paid'] }
            }
        });
        const totalSales = Math.round((invoices._sum.grandTotal || 0) * 100) / 100;
        const totalReceived = Math.round((payments._sum.amount || 0) * 100) / 100;
        const totalExpenses = Math.round(((expenses._sum.amount || 0) + (salaries._sum.amount || 0)) * 100) / 100;
        const totalOutstanding = Math.round((totalSales - totalReceived) * 100) / 100;
        res.status(200).json({
            totalSales,
            totalReceived,
            totalOutstanding,
            totalExpenses
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
