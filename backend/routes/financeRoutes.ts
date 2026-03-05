import express from 'express';
import * as financeController from '../controllers/modules/financeController.js';
import { checkSubscriptionStatus } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

router.use(checkSubscriptionStatus);

router.get('/dashboard', financeController.getDashboardStats);

export default router;
