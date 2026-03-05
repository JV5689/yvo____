import { Request, Response } from 'express';
import { prisma } from '../../src/config/db.js';
import { AuthRequest } from '../../src/middleware/auth.js';
import { AppError } from '../../src/middleware/errorHandler.js';

// Get all invoices
export const getInvoices = async (req: Request, res: Response) => {
    const { companyId } = (req as AuthRequest).user!;
    const { isDeleted } = req.query;

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId: companyId!,
            isDeleted: isDeleted === 'true'
        },
        orderBy: { date: 'desc' }
    });
    res.status(200).json(invoices);
};

// Get next sequential invoice number
export const getNextInvoiceNumber = async (req: Request, res: Response) => {
    const { companyId } = (req as AuthRequest).user!;

    const count = await prisma.invoice.count({
        where: { companyId: companyId! }
    });

    const nextNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    res.status(200).json({ invoiceNumber: nextNumber });
};

// Get single invoice
export const getInvoiceById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyId } = (req as AuthRequest).user!;

    const invoice = await prisma.invoice.findFirst({
        where: {
            id: String(id),
            companyId: companyId!
        },
        include: {
            customer: { select: { name: true, email: true } },
            items: true
        }
    });

    if (!invoice || invoice.isDeleted) {
        throw new AppError('Invoice not found', 404);
    }

    res.status(200).json(invoice);
};

// Create invoice
export const createInvoice = async (req: Request, res: Response) => {
    const { companyId } = (req as AuthRequest).user!;
    const {
        invoiceNumber, customerId, customerName, clientAddress, gstNumber,
        date, items, status, templateId, layout, taxRate: providedTaxRate,
        customAttributes
    } = req.body;

    const taxRate = providedTaxRate !== undefined ? providedTaxRate : 10;
    const subtotal = (items || []).reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const taxTotal = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxTotal;

    const cleansedItems = (items || []).map((item: any) => {
        const newItem = { ...item };
        if (!newItem.inventoryId) delete newItem.inventoryId;
        newItem.quantity = parseFloat(item.quantity) || 0;
        newItem.price = parseFloat(item.price) || 0;
        newItem.total = parseFloat(item.total) || 0;
        return newItem;
    });

    // Transaction for stock update and invoice creation
    const newInvoice = await prisma.$transaction(async (tx) => {
        if (status !== 'DRAFT') {
            for (const item of cleansedItems) {
                if (item.inventoryId) {
                    const inventoryItem = await tx.inventoryItem.findFirst({
                        where: { id: item.inventoryId, companyId: companyId! }
                    });
                    if (!inventoryItem || inventoryItem.quantityOnHand < item.quantity) {
                        throw new AppError(`Insufficient stock for ${item.description}`, 400);
                    }
                    await tx.inventoryItem.update({
                        where: { id: inventoryItem.id },
                        data: { quantityOnHand: { decrement: item.quantity } }
                    });
                }
            }
        }

        return await tx.invoice.create({
            data: {
                companyId: companyId!,
                invoiceNumber: String(invoiceNumber),
                customerId: String(customerId),
                customerName: String(customerName || ''),
                clientAddress: String(clientAddress || ''),
                gstNumber: gstNumber ? String(gstNumber) : undefined,
                date: new Date(date),
                subtotal,
                taxTotal,
                grandTotal,
                status: status || 'DRAFT',
                templateId: templateId ? String(templateId) : undefined,
                layout: layout || [],
                customAttributes: customAttributes || [],
                taxRate,
                items: { create: cleansedItems }
            },
            include: { items: true }
        });
    });

    res.status(201).json(newInvoice);
};

// Update invoice
export const updateInvoice = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyId } = (req as AuthRequest).user!;

    const existing = await prisma.invoice.findFirst({
        where: { id: String(id), companyId: companyId! }
    });
    if (!existing) throw new AppError('Invoice not found', 404);

    const {
        invoiceNumber, customerId, customerName, clientAddress, gstNumber,
        date, status, templateId, layout, isDeleted, items,
        taxRate: providedTaxRate, customAttributes,
    } = req.body;

    const taxRate = providedTaxRate !== undefined ? providedTaxRate : 10;

    const cleansedItems = (items || []).map((item: any) => {
        const newItem = { ...item };
        delete newItem.id;
        delete newItem.invoiceId;
        delete newItem.invoice;
        delete newItem.inventory;
        if (!newItem.inventoryId) delete newItem.inventoryId;
        newItem.quantity = parseFloat(item.quantity) || 0;
        newItem.price = parseFloat(item.price) || 0;
        newItem.total = parseFloat(item.total) || 0;
        return newItem;
    });

    const subtotal = cleansedItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const taxTotal = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxTotal;

    const updatedInvoice = await prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: String(id) } });

        const updates: any = {
            lastModifiedAt: new Date(),
            taxRate,
            subtotal,
            taxTotal,
            grandTotal,
            items: { create: cleansedItems },
        };

        if (invoiceNumber !== undefined) updates.invoiceNumber = invoiceNumber;
        if (customerId !== undefined) updates.customerId = customerId;
        if (customerName !== undefined) updates.customerName = customerName;
        if (clientAddress !== undefined) updates.clientAddress = clientAddress;
        if (gstNumber !== undefined) updates.gstNumber = gstNumber;
        if (date !== undefined) updates.date = new Date(date);
        if (status !== undefined) updates.status = status;
        if (templateId !== undefined) updates.templateId = templateId;
        if (layout !== undefined) updates.layout = layout;
        if (isDeleted !== undefined) updates.isDeleted = isDeleted;
        if (customAttributes !== undefined) updates.customAttributes = customAttributes;

        return await tx.invoice.update({
            where: { id: String(id) },
            data: updates,
            include: { items: true }
        });
    });

    res.status(200).json(updatedInvoice);
};

// Delete (soft)
export const deleteInvoice = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyId } = (req as AuthRequest).user!;

    const result = await prisma.invoice.updateMany({
        where: { id: String(id), companyId: companyId! },
        data: { isDeleted: true, lastModifiedAt: new Date() }
    });

    if (result.count === 0) throw new AppError('Invoice not found', 404);

    res.status(200).json({ message: 'Invoice deleted successfully' });
};

// Restore
export const restoreInvoice = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyId } = (req as AuthRequest).user!;

    const result = await prisma.invoice.updateMany({
        where: { id: String(id), companyId: companyId! },
        data: { isDeleted: false, lastModifiedAt: new Date() }
    });

    if (result.count === 0) throw new AppError('Invoice not found', 404);

    res.status(200).json({ message: 'Invoice restored successfully' });
};
