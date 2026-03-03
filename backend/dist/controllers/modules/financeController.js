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
        // Total Expenses
        const expenses = await prisma.expense.aggregate({
            _sum: {
                amount: true
            },
            where: {
                companyId: companyObjectId,
                isDeleted: false
            }
        });
        const totalSales = invoices._sum.grandTotal || 0;
        const totalReceived = payments._sum.amount || 0;
        const totalExpenses = expenses._sum.amount || 0;
        const totalOutstanding = totalSales - totalReceived;
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
