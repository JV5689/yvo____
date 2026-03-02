import { Request, Response } from 'express';
import { prisma } from '../../src/config/db.js';

export const getPayments = async (req: Request, res: Response) => {
    try {
        const { companyId, customerId } = req.query;
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const filter: any = { companyId: String(companyId), isDeleted: false };
        if (customerId) filter.customerId = String(customerId);

        const payments = await prisma.payment.findMany({
            where: filter,
            include: { customer: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
        res.status(200).json(payments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createPayment = async (req: Request, res: Response) => {
    try {
        console.log('[PaymentController] Creating payment:', req.body);
        const { companyId, customerId, amount, date, method, invoiceAllocation } = req.body;
        if (!companyId || !customerId || amount === undefined) {
            console.warn('[PaymentController] Missing required fields:', { companyId, customerId, amount });
            return res.status(400).json({ message: 'Company, Customer, and Amount required' });
        }

        const newPayment = await prisma.payment.create({
            data: {
                companyId: String(companyId),
                customerId: String(customerId),
                amount: Number(amount),
                date: date ? new Date(date) : undefined,
                method
            }
        });

        console.log('[PaymentController] Payment saved successfully:', newPayment.id);
        res.status(201).json(newPayment);
    } catch (error: any) {
        console.error('[PaymentController] Error creating payment:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updatePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Cast potential typed properties
        if (updates.amount !== undefined) updates.amount = Number(updates.amount);
        if (updates.date !== undefined) updates.date = new Date(updates.date);

        const payment = await prisma.payment.update({
            where: { id: String(id) },
            data: updates
        });

        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.status(200).json(payment);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deletePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const payment = await prisma.payment.update({
            where: { id: String(id) },
            data: { isDeleted: true }
        });
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.status(200).json({ message: 'Payment deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
