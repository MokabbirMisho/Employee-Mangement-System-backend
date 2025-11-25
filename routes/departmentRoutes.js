import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addDepartment,
  listDepartments,
  deleteDepartment,
  getDepartmentById,
  updateDepartment,
} from "../controllers/departmentControllers.js";

const router = express.Router();

router.get("/", authMiddleware, listDepartments);
router.get("/:id", authMiddleware, getDepartmentById);
router.post("/add", authMiddleware, addDepartment);
router.put("/:id", authMiddleware, updateDepartment);
router.delete("/:id", authMiddleware, deleteDepartment);

export default router;
