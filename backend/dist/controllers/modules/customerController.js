import { prisma } from '../../src/config/db.js';
import { AppError } from '../../src/middleware/errorHandler.js';
// Get all customers for a company
export const getCustomers = async (req, res) => {
    const { companyId } = req.user;
    const customers = await prisma.customer.findMany({
        where: { companyId: companyId, isDeleted: false },
        include: {
            invoices: {
                where: { isDeleted: false, status: { notIn: ['DRAFT', 'CANCELLED'] } }
            }
        },
        orderBy: { lastModifiedAt: 'desc' }
    });
    const mappedCustomers = await Promise.all(customers.map(async (customer) => {
        const totalInvoiced = (customer.invoices || []).reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const payments = await prisma.payment.findMany({
            where: { customerId: customer.id, isDeleted: false }
        });
        const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        return {
            ...customer,
            invoices: undefined,
            totalInvoiced,
            totalReceived,
            totalDue: Math.max(0, totalInvoiced - totalReceived)
        };
    }));
    res.status(200).json(mappedCustomers);
};
// Get single customer
export const getCustomerById = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const customer = await prisma.customer.findFirst({
        where: { id: String(id), companyId: companyId }
    });
    if (!customer || customer.isDeleted) {
        throw new AppError('Customer not found', 404);
    }
    res.status(200).json(customer);
};
// Get single customer ledger
export const getCustomerLedger = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const customer = await prisma.customer.findFirst({
        where: { id: String(id), companyId: companyId },
        include: {
            invoices: {
                where: { isDeleted: false },
                include: { items: true },
                orderBy: { date: 'desc' },
            },
            payments: {
                where: { isDeleted: false },
                orderBy: { date: 'desc' },
            }
        }
    });
    if (!customer || customer.isDeleted) {
        throw new AppError('Customer not found', 404);
    }
    const totalInvoiced = customer.invoices
        .filter((inv) => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED')
        .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const totalReceived = customer.payments
        .reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const result = {
        ...customer,
        totalInvoiced,
        totalReceived,
        totalDue: Math.max(0, totalInvoiced - totalReceived),
    };
    res.status(200).json(result);
};
// Create customer
export const createCustomer = async (req, res) => {
    const { companyId } = req.user;
    const { name, email, phone, address, taxId } = req.body;
    const newCustomer = await prisma.customer.create({
        data: {
            companyId: companyId,
            name,
            email,
            phone,
            address,
            taxId
        }
    });
    res.status(201).json(newCustomer);
};
// Update customer
export const updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const updates = { ...req.body };
    delete updates.companyId;
    const result = await prisma.customer.updateMany({
        where: { id: String(id), companyId: companyId },
        data: { ...updates, lastModifiedAt: new Date() }
    });
    if (result.count === 0)
        throw new AppError('Customer not found', 404);
    const updated = await prisma.customer.findUnique({ where: { id: String(id) } });
    res.status(200).json(updated);
};
// Delete (Soft)
export const deleteCustomer = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const result = await prisma.customer.updateMany({
        where: { id: String(id), companyId: companyId },
        data: { isDeleted: true, lastModifiedAt: new Date() }
    });
    if (result.count === 0)
        throw new AppError('Customer not found', 404);
    res.status(200).json({ message: 'Customer deleted successfully' });
};
// Restore
export const restoreCustomer = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const result = await prisma.customer.updateMany({
        where: { id: String(id), companyId: companyId },
        data: { isDeleted: false, lastModifiedAt: new Date() }
    });
    if (result.count === 0)
        throw new AppError('Customer not found', 404);
    res.status(200).json({ message: 'Customer restored successfully' });
};
