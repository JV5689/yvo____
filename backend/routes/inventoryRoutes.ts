import express from 'express';
import * as inventoryController from '../controllers/modules/inventoryController.js';
import { checkSubscriptionStatus } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// Apply Subscription Check
router.use(checkSubscriptionStatus);

router.get('/', inventoryController.getInventory);
router.get('/:id', inventoryController.getInventoryItemById);
router.post('/', inventoryController.createInventoryItem);
router.patch('/:id', inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
router.post('/:id/restore', inventoryController.restoreInventoryItem);
router.delete('/:id/permanent', inventoryController.deleteItemPermanently);

export default router;
