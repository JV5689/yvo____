import express from 'express';
import * as calendarController from '../controllers/modules/calendarController.js';
import { checkSubscriptionStatus } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

router.use(checkSubscriptionStatus);

router.get('/', calendarController.getEvents);
router.post('/', calendarController.createEvent);
router.put('/:id', calendarController.updateEvent);
router.delete('/:id', calendarController.deleteEvent);

export default router;
