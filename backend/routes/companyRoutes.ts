import express from 'express';
import * as configController from '../controllers/company/configController.js';

const router = express.Router();

// Middleware to check company membership would go here
// router.use(requireCompanyMember);

router.get('/config', configController.getConfig);
router.patch('/:id', configController.updateCompany);
router.post('/verify-password', configController.verifyPassword); // Security check
router.post('/invoice-attributes', configController.addInvoiceAttribute);

export default router;
