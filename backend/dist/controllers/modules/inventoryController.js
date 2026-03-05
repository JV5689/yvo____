import { prisma } from '../../src/config/db.js';
import { AppError } from '../../src/middleware/errorHandler.js';
// Get all inventory items
export const getInventory = async (req, res) => {
    const { companyId } = req.user;
    const { showDeleted } = req.query;
    const isDeleted = showDeleted === 'true' ? 1 : 0;
    // Use parameterized query to prevent SQL injection
    const items = await prisma.$queryRaw `
    SELECT * FROM inventoryitem 
    WHERE companyId = ${companyId} AND isDeleted = ${isDeleted} 
    ORDER BY name ASC
  `;
    res.status(200).json(items);
};
// Get single item
export const getInventoryItemById = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const item = await prisma.inventoryItem.findFirst({
        where: {
            id: String(id),
            companyId: companyId
        }
    });
    if (!item || item.isDeleted) {
        throw new AppError('Item not found', 404);
    }
    res.status(200).json(item);
};
// Create item
export const createInventoryItem = async (req, res) => {
    const { companyId } = req.user;
    const { sku, name, description, quantityOnHand, reorderLevel, sellingPrice, category, image } = req.body;
    const newItem = await prisma.inventoryItem.create({
        data: {
            companyId: companyId,
            sku: String(sku),
            name: String(name),
            description,
            quantityOnHand: quantityOnHand !== undefined ? Number(quantityOnHand) : 0,
            reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 5,
            sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
            category
        }
    });
    if (image && newItem.id) {
        await prisma.$executeRaw `UPDATE inventoryitem SET image = ${image} WHERE id = ${newItem.id}`;
    }
    res.status(201).json({ ...newItem, image: image || null });
};
// Update item
export const updateInventoryItem = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const updates = { ...req.body };
    const image = updates.image;
    delete updates.image;
    delete updates.companyId;
    // Verify ownership before update
    const existing = await prisma.inventoryItem.findFirst({
        where: { id: String(id), companyId: companyId }
    });
    if (!existing)
        throw new AppError('Item not found', 404);
    if (updates.quantityOnHand !== undefined)
        updates.quantityOnHand = Number(updates.quantityOnHand);
    if (updates.reorderLevel !== undefined)
        updates.reorderLevel = Number(updates.reorderLevel);
    if (updates.sellingPrice !== undefined)
        updates.sellingPrice = Number(updates.sellingPrice);
    const item = await prisma.inventoryItem.update({
        where: { id: String(id) },
        data: { ...updates, lastModifiedAt: new Date() }
    });
    if (image !== undefined) {
        await prisma.$executeRaw `UPDATE inventoryitem SET image = ${image} WHERE id = ${id}`;
    }
    res.status(200).json({ ...item, image: image !== undefined ? image : null });
};
// Delete item (soft)
export const deleteInventoryItem = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const item = await prisma.inventoryItem.updateMany({
        where: { id: String(id), companyId: companyId },
        data: { isDeleted: true, lastModifiedAt: new Date() }
    });
    if (item.count === 0)
        throw new AppError('Item not found', 404);
    res.status(200).json({ message: 'Item deleted successfully' });
};
// Restore item
export const restoreInventoryItem = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const item = await prisma.inventoryItem.updateMany({
        where: { id: String(id), companyId: companyId },
        data: { isDeleted: false, lastModifiedAt: new Date() }
    });
    if (item.count === 0)
        throw new AppError('Item not found', 404);
    res.status(200).json({ message: 'Item restored successfully' });
};
// Delete permanently
export const deleteItemPermanently = async (req, res) => {
    const { id } = req.params;
    const { companyId } = req.user;
    const result = await prisma.inventoryItem.deleteMany({
        where: { id: String(id), companyId: companyId }
    });
    if (result.count === 0)
        throw new AppError('Item not found', 404);
    res.status(200).json({ message: 'Item permanently deleted' });
};
