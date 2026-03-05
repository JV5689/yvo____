import express from 'express';
import * as paymentController from '../controllers/modules/paymentController.js';
import { checkSubscriptionStatus } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

router.use(checkSubscriptionStatus);

router.get('/', paymentController.getPayments);
router.post('/', paymentController.createPayment);
router.patch('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);
router.patch('/:id/restore', paymentController.restorePayment);

export default router;
