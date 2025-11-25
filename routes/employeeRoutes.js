import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addEmployee,
  upload,
  listEmployees,
  deleteEmployee,
  getSingleEmployee,
  updateEmployee,
  getMyEmployeeProfile,
} from "../controllers/employeeControllers.js";

const router = express.Router();

router.get("/", authMiddleware, listEmployees);
router.get("/:id", authMiddleware, getSingleEmployee);
router.post("/add", authMiddleware, upload.single("avatar"), addEmployee);
router.put("/:id", authMiddleware, upload.single("avatar"), updateEmployee);
router.delete("/:id", authMiddleware, deleteEmployee);

// Logged-in employee's own profile
router.get("/me/profile", authMiddleware, getMyEmployeeProfile);

export default router;
