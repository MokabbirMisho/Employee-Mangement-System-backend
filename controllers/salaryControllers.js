// controllers/salaryControllers.js
import Salary from "../models/salary.js";
import Employee from "../models/employee.js";

export const saveSalary = async (req, res) => {
  try {
    const {
      employee, // employee Mongo _id
      department, // department _id
      employeeId, // "EMP-001" etc (string)
      basicSalary,
      allowance = 0,
      deductions = 0,
      payDate, // optional; if not provided we'll use now()
    } = req.body;

    // Basic validation
    if (!employee || !department || basicSalary == null) {
      return res.status(400).json({
        success: false,
        error: "employee, department and basicSalary are required",
      });
    }

    const basic = Number(basicSalary);
    const allow = Number(allowance || 0);
    const ded = Number(deductions || 0);

    if (Number.isNaN(basic) || basic < 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid basic salary" });
    }
    if (Number.isNaN(allow) || allow < 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid allowance" });
    }
    if (Number.isNaN(ded) || ded < 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid deductions" });
    }

    const netSalary = basic + allow - ded;

    // Make sure the employee exists
    const empDoc = await Employee.findById(employee);
    if (!empDoc) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found" });
    }

    // ------------------------------
    // 🔑 KEY LOGIC:
    // Keep ONLY ONE salary per employee.
    // Use employeeId if present, otherwise fallback to employee ObjectId.
    // ------------------------------
    const deleteQuery = employeeId ? { employeeId } : { employee };

    // Remove any previous salary records for this employee
    await Salary.deleteMany(deleteQuery);

    // Decide pay date (if you still want it)
    const finalPayDate = payDate ? new Date(payDate) : new Date();

    // Create a fresh salary record
    const salaryDoc = await Salary.create({
      employee, // ObjectId ref to Employee
      department, // ObjectId ref to Department
      employeeId, // human readable code
      basicSalary: basic,
      allowance: allow,
      deductions: ded,
      netSalary,
      payDate: finalPayDate,
    });

    // Also update Employee.salary with netSalary (current salary)
    empDoc.salary = netSalary;
    await empDoc.save();

    return res.status(201).json({
      success: true,
      message: "Salary saved successfully",
      salary: salaryDoc,
    });
  } catch (error) {
    console.error("saveSalary error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while saving salary",
    });
  }
};

/**
 * GET /api/salary
 * Optional: list all salaries with populated employee & department
 */
export const listSalaries = async (_req, res) => {
  try {
    const salaries = await Salary.find()
      .populate({
        path: "employee",
        populate: {
          path: "userId",
          select: "name email avatar",
        },
      })
      .populate("department", "dept_name");

    return res.status(200).json({
      success: true,
      salaries,
    });
  } catch (error) {
    console.error("listSalaries error:", error);
    return res.status(500).json({
      success: false,
      error: "Error fetching salaries",
    });
  }
};

export const getMySalaries = async (req, res) => {
  try {
    // we assume authMiddleware set req.user._id
    const userId = req.user._id;

    // find employee record for this user
    const employee = await Employee.findOne({ userId }).populate(
      "department",
      "dept_name"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee profile not found for this user",
      });
    }

    // find all salary records for this employee, latest first
    const salaries = await Salary.find({ employee: employee._id })
      .populate("department", "dept_name")
      .sort({ payDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        department: employee.department,
      },
      salaries,
    });
  } catch (error) {
    console.error("getMySalaries error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while fetching salary records",
    });
  }
};
