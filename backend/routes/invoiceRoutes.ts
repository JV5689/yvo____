import express from 'express';
import * as invoiceController from '../controllers/modules/invoiceController.js';
import { authenticate, authorize } from '../src/middleware/auth.js';
import { tenantIsolation } from '../src/middleware/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(tenantIsolation);

router.get('/', invoiceController.getInvoices);
router.get('/next-number', invoiceController.getNextInvoiceNumber);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', authorize('OWNER', 'ADMIN'), invoiceController.createInvoice);
router.patch('/:id', authorize('OWNER', 'ADMIN'), invoiceController.updateInvoice);
router.delete('/:id', authorize('OWNER', 'ADMIN'), invoiceController.deleteInvoice);
router.patch('/:id/restore', authorize('OWNER', 'ADMIN'), invoiceController.restoreInvoice);

export default router;
