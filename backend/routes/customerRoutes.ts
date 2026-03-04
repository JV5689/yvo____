import express from 'express';
import * as customerController from '../controllers/modules/customerController.js';
import { authenticate, authorize } from '../src/middleware/auth.js';
import { tenantIsolation } from '../src/middleware/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(tenantIsolation);

router.get('/', customerController.getCustomers);
router.get('/:id/ledger', customerController.getCustomerLedger);
router.get('/:id', customerController.getCustomerById);
router.post('/', authorize('OWNER', 'ADMIN'), customerController.createCustomer);
router.patch('/:id', authorize('OWNER', 'ADMIN'), customerController.updateCustomer);
router.delete('/:id', authorize('OWNER', 'ADMIN'), customerController.deleteCustomer);
router.patch('/:id/restore', authorize('OWNER', 'ADMIN'), customerController.restoreCustomer);

export default router;
