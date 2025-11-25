// routes/salaryRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  saveSalary,
  listSalaries,
  getMySalaries,
} from "../controllers/salaryControllers.js";

const router = express.Router();

//  update salary for an employee
router.post("/addSalary", authMiddleware, saveSalary);

//  list all salaries
router.get("/", authMiddleware, listSalaries);

// logged-in employee sees their own salaries
router.get("/my", authMiddleware, getMySalaries);

export default router;
