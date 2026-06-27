import express from "express";
import {
  shareNode,
  getShares,
  getPendingSharesForUser,
  getAcceptedSharedNotes,
  getMySharedNotes,
  acceptShare,
  rejectShare,
  removeShare,
  markNotificationsSeen,
} from "../controllers/shareController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/:note_id", shareNode);
router.get("/note/:note_id", getShares);
router.get("/notifications", getPendingSharesForUser);
router.patch("/notifications/seen", markNotificationsSeen);
router.get("/accepted", getAcceptedSharedNotes);
router.get("/my-shared", getMySharedNotes);
router.post("/:share_id/accept", acceptShare);
router.post("/:share_id/reject", rejectShare);
router.delete("/:share_id", removeShare);

export default router;
