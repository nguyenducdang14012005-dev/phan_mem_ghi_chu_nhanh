import express from 'express';
import * as reminderController from '../controllers/reminderController.js';

const router = express.Router();

router.get('/', reminderController.getReminders);      // ← đổi tên
router.post('/', reminderController.setReminder);      // ← đổi tên
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);

export default router;