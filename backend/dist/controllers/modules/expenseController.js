import { prisma } from '../../src/config/db.js';
// Get all expenses
export const getExpenses = async (req, res) => {
    try {
        const { companyId, start, end } = req.query;
        if (!companyId)
            return res.status(400).json({ message: 'Company ID is required' });
        const query = { companyId: String(companyId), isDeleted: false };
        if (start && end) {
            query.date = { gte: new Date(start), lte: new Date(end) };
        }
        const expenses = await prisma.expense.findMany({
            where: query,
            orderBy: { date: 'desc' }
        });
        res.status(200).json(expenses);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Create expense
export const createExpense = async (req, res) => {
    try {
        const { companyId, category, amount, date, description, paymentMethod } = req.body;
        if (!companyId || !amount) {
            return res.status(400).json({ message: 'Company ID and Amount are required' });
        }
        const newExpense = await prisma.expense.create({
            data: {
                companyId: String(companyId),
                category,
                amount: Number(amount),
                date: date ? new Date(date) : undefined,
                description,
                paymentMethod
            }
        });
        res.status(201).json(newExpense);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update expense
export const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Ensure decimal and date casts if present in updates
        if (updates.amount)
            updates.amount = Number(updates.amount);
        if (updates.date)
            updates.date = new Date(updates.date);
        const expense = await prisma.expense.update({
            where: { id: String(id) },
            data: updates
        });
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.status(200).json(expense);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Delete expense
export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await prisma.expense.update({
            where: { id: String(id) },
            data: { isDeleted: true }
        });
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.status(200).json({ message: 'Expense deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
