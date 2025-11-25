// models/salary.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const salarySchema = new Schema({
  // Reference to Employee document
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },

  // Reference to Department (helps with filtering and reports)
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },

  // Human-readable employee id, e.g. "EMP-001" (for convenience)
  employeeId: {
    type: String,
  },

  // Core salary fields
  basicSalary: {
    type: Number,
    required: true,
  },

  allowance: {
    type: Number,
    default: 0,
  },

  deductions: {
    type: Number,
    default: 0,
  },

  // Calculated: basic + allowance - deductions
  netSalary: {
    type: Number,
    required: true,
  },

  // For monthly salary records, etc.
  payDate: {
    type: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Salary = mongoose.model("Salary", salarySchema);

export default Salary;
