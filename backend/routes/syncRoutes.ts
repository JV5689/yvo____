import express from 'express';
import * as syncController from '../controllers/syncController.js';

const router = express.Router();

// Middleware to verify Device Token/API Key would go here
// router.use(verifyDeviceAuth);

router.post('/push', syncController.pushChanges);
router.get('/pull', syncController.pullChanges);

export default router;
