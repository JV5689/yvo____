import express from 'express';
import * as customerController from '../controllers/modules/customerController.js';
import { checkSubscriptionStatus } from '../middleware/subscriptionMiddleware.js';
const router = express.Router();
router.use(checkSubscriptionStatus);
// Middleware to check authentication/company context should be applied here or in server.js
// router.use(authMiddleware);
router.get('/', customerController.getCustomers);
router.get('/:id/ledger', customerController.getCustomerLedger); // must be before /:id
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.patch('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.patch('/:id/restore', customerController.restoreCustomer);
export default router;
