import { prisma } from '../../src/config/db.js';
// Get all customers for a company
export const getCustomers = async (req, res) => {
    try {
        const { companyId } = req.query; // Or from auth middleware if available like req.user.companyId
        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required' });
        }
        const customers = await prisma.customer.findMany({
            where: { companyId: String(companyId), isDeleted: false },
            include: {
                invoices: {
                    where: { isDeleted: false, status: { notIn: ['DRAFT', 'CANCELLED'] } }
                }
            },
            orderBy: { lastModifiedAt: 'desc' }
        });
        // Prisma doesn't do deep aggregation easily like Mongoose $lookup -> $project in a single pass.
        // We will fetch payments separately or map them out. However, currently Prisma Schema doesn't
        // map `Payment` model yet to this project (from what we can see, or at least no explicit relation 
        // back to customer from Payments directly if invoices are the link). Let's assume Payments is linked
        // to Invoice or Customer. Assuming Invoice.
        // Manual Map to preserve response
        const mappedCustomers = await Promise.all(customers.map(async (customer) => {
            const totalInvoiced = customer.invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
            // Fetch payments to calculate actual received amount
            const payments = await prisma.payment.findMany({
                where: { customerId: customer.id, isDeleted: false }
            });
            const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            return {
                ...customer,
                invoices: undefined, // remove from output like Mongoose $project
                totalInvoiced,
                totalReceived,
                totalDue: Math.max(0, totalInvoiced - totalReceived)
            };
        }));
        res.status(200).json(mappedCustomers);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get single customer
export const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma.customer.findUnique({ where: { id: String(id) } });
        if (!customer || customer.isDeleted) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.status(200).json(customer);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get single customer ledger (customer + invoices + payments + totals)
export const getCustomerLedger = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = String(id);
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
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
            return res.status(404).json({ message: 'Customer not found' });
        }
        const totalInvoiced = customer.invoices
            .filter(inv => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED')
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
    }
    catch (error) {
        console.error('Error fetching customer ledger:', error.message, error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
// Create customer
export const createCustomer = async (req, res) => {
    try {
        const { companyId, name, email, phone, address, taxId } = req.body;
        if (!companyId || !name) {
            return res.status(400).json({ message: 'Company ID and Name are required' });
        }
        const newCustomer = await prisma.customer.create({
            data: {
                companyId: String(companyId),
                name,
                email,
                phone,
                address,
                taxId
            }
        });
        res.status(201).json(newCustomer);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update customer
export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const customer = await prisma.customer.update({
            where: { id: String(id) },
            data: { ...updates, lastModifiedAt: new Date() }
        });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.status(200).json(customer);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Delete (Soft delete) customer
export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma.customer.update({
            where: { id: String(id) },
            data: { isDeleted: true, lastModifiedAt: new Date() }
        });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.status(200).json({ message: 'Customer deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Restore (Undo soft delete) customer
export const restoreCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma.customer.update({
            where: { id: String(id) },
            data: { isDeleted: false, lastModifiedAt: new Date() }
        });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.status(200).json({ message: 'Customer restored successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
