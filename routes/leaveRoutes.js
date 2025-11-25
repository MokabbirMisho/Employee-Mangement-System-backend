import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addLeave,
  getMyLeaves,
  getAdminLeaves,
  getSingleLeave,
  updateLeaveStatus,
  getMyLeaveNotifications,
  markMyLeaveNotificationsSeen,
} from "../controllers/leaveControllers.js";

const router = express.Router();

// Logged-in employee submits a leave request
router.post("/", authMiddleware, addLeave);
// Admin leaves list
router.get("/admin", authMiddleware, getAdminLeaves);
router.get("/admin/:id", getSingleLeave);
router.put("/admin/:id/status", updateLeaveStatus);

// Logged-in employee sees their own leave history
router.get("/my", authMiddleware, getMyLeaves);
router.get("/my/notifications", authMiddleware, getMyLeaveNotifications);
router.patch(
  "/my/notifications/mark-seen",
  authMiddleware,
  markMyLeaveNotificationsSeen
);

export default router;
