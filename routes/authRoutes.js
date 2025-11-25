import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  login,
  verify,
  changePassword,
} from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login", login);
router.post("/verify", authMiddleware, verify);
// Change password (logged-in user)
router.post("/change-password", authMiddleware, changePassword);

export default router;
