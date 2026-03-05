import express from 'express';
import * as clientController from '../controllers/sa/clientController.js';

const router = express.Router();

// Public Clients API
router.get('/clients', clientController.getClients);

export default router;
