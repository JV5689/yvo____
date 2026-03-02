import { Request, Response } from 'express';
import { prisma } from '../../src/config/db.js';

// Get all invoices
export const getInvoices = async (req: Request, res: Response) => {
    try {
        const { companyId, isDeleted } = req.query;

        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const filter = {
            companyId: String(companyId),
            isDeleted: isDeleted === 'true' // Convert string 'true' to boolean true, else false
        };

        const invoices = await prisma.invoice.findMany({
            where: filter,
            orderBy: { date: 'desc' }
        });
        res.status(200).json(invoices);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get single invoice
export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { id: String(id) },
            include: {
                customer: { select: { name: true, email: true } },
                items: true
            }
        });

        if (!invoice || invoice.isDeleted) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json(invoice);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Create invoice
export const createInvoice = async (req: Request, res: Response) => {
    try {
        const { companyId, invoiceNumber, customerId, customerName, clientAddress, gstNumber, date, items, status, templateId, layout, taxRate: providedTaxRate, customAttributes } = req.body;

        if (!companyId || !invoiceNumber || !customerId) {
            return res.status(400).json({ message: 'Company ID, Customer ID, and Invoice Number are required' });
        }

        const taxRate = providedTaxRate !== undefined ? providedTaxRate : 10;
        const subtotal = (items || []).reduce((sum: number, item: any) => sum + (item.total || 0), 0);
        const taxTotal = subtotal * (taxRate / 100);
        const grandTotal = subtotal + taxTotal;

        const cleansedItems = (items || []).map((item: any) => {
            const newItem = { ...item };
            if (newItem.inventoryId === "" || newItem.inventoryId === null) {
                delete newItem.inventoryId;
            }
            newItem.quantity = parseFloat(item.quantity) || 0;
            newItem.price = parseFloat(item.price) || 0;
            newItem.total = parseFloat(item.total) || 0;
            // Handle customFields if they exist
            if (newItem.customFields && typeof newItem.customFields !== 'object') {
                newItem.customFields = {};
            }
            return newItem;
        });

        if (status !== 'DRAFT') {
            for (const item of cleansedItems) {
                if (item.inventoryId) {
                    const inventoryItem = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryId } });
                    if (inventoryItem && inventoryItem.quantityOnHand < item.quantity) {
                        return res.status(400).json({ message: `Insufficient stock for ${item.description}` });
                    }
                    if (inventoryItem) {
                        await prisma.inventoryItem.update({
                            where: { id: inventoryItem.id },
                            data: { quantityOnHand: { decrement: item.quantity } }
                        });
                    }
                }
            }
        }

        const newInvoice = await prisma.invoice.create({
            data: {
                companyId: String(companyId),
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
                layout: (() => {
                    // If layout was sent, use it
                    if (layout && Array.isArray(layout) && layout.length > 0) return layout;
                    // Otherwise return empty — viewer will fallback to template at display time
                    return [];
                })(),
                customAttributes: customAttributes || [],
                taxRate,
                items: {
                    create: cleansedItems
                }
            },
            include: { items: true }
        });

        res.status(201).json(newInvoice);
    } catch (error: any) {
        console.error("CRITICAL ERROR IN CREATE INVOICE:", error);
        res.status(500).json({ message: error.message || "Server Error" });
    }
};

// Update invoice
export const updateInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Destructure ONLY known safe scalar fields — do NOT spread req.body directly
        // because getInvoiceById includes customer/company relations and those break Prisma update
        const {
            invoiceNumber,
            customerId,
            customerName,
            clientAddress,
            gstNumber,
            date,
            status,
            templateId,
            layout,
            isDeleted,
            items,
            taxRate: providedTaxRate,
            customAttributes,
        } = req.body;

        const taxRate = providedTaxRate !== undefined ? providedTaxRate : 10;

        const cleansedItems = (items || []).map((item: any) => {
            const newItem = { ...item };
            // Strip Prisma relation & identity fields
            delete newItem.id;
            delete newItem.invoiceId;
            delete newItem.invoice;
            delete newItem.inventory;
            delete newItem.customFields;
            if (newItem.inventoryId === '' || newItem.inventoryId === null) {
                delete newItem.inventoryId;
            }
            newItem.quantity = parseFloat(item.quantity) || 0;
            newItem.price = parseFloat(item.price) || 0;
            newItem.total = parseFloat(item.total) || 0;
            return newItem;
        });

        const subtotal = cleansedItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
        const taxTotal = subtotal * (taxRate / 100);
        const grandTotal = subtotal + taxTotal;

        // Delete existing items and recreate (safest approach)
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: String(id) } });

        const updates: any = {
            lastModifiedAt: new Date(),
            taxRate,
            subtotal,
            taxTotal,
            grandTotal,
            items: { create: cleansedItems },
        };

        // Only include fields that are actually provided
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

        const invoice = await prisma.invoice.update({
            where: { id: String(id) },
            data: updates,
            include: { items: true }
        });

        res.status(200).json(invoice);
    } catch (error: any) {
        console.error('CRITICAL ERROR IN UPDATE INVOICE:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};


// Delete invoice
export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.update({
            where: { id: String(id) },
            data: { isDeleted: true, lastModifiedAt: new Date() }
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
