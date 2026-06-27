import express from "express";
import * as reminderController from "../controllers/reminderController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", reminderController.getReminders);
router.post("/", reminderController.setReminder);
router.put("/:id", reminderController.updateReminder);
router.delete("/:id", reminderController.deleteReminder);
router.get("/due-now", reminderController.getDueReminders);
router.put("/confirm/:id", reminderController.confirmReminder);

export default router;
