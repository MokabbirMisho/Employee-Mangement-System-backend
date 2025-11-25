import Department from "../models/department.js";
import Employee from "../models/employee.js";
import User from "../models/User.js";
import Salary from "../models/salary.js";
import Leave from "../models/leave.js";

export const addDepartment = async (req, res) => {
  try {
    const { dept_name, dept_head, description } = req.body;
    const newDept = new Department({
      dept_name,
      dept_head,
      description,
    });
    await newDept.save();
    return res.status(200).json({ success: true, department: newDept });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "add department server error" });
  }
};

export const listDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: 1 });
    res.json({ success: true, departments });
  } catch (e) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept)
      return res
        .status(404)
        .json({ success: false, error: "department not found" });
    return res.json({ success: true, department: dept });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "get department server error" });
  }
};

/**
 * PUT /api/department/:id
 */
export const updateDepartment = async (req, res) => {
  try {
    const { dept_name, dept_head, description } = req.body;

    // Only set provided fields
    const update = {};
    if (typeof dept_name !== "undefined") update.dept_name = dept_name;
    if (typeof dept_head !== "undefined") update.dept_head = dept_head;
    if (typeof description !== "undefined") update.description = description;

    const updated = await Department.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated)
      return res
        .status(404)
        .json({ success: false, error: "department not found" });
    return res.json({ success: true, department: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "update department server error" });
  }
};
// DELETE /api/department/:id
export const deleteDepartment = async (req, res) => {
  try {
    const deptId = req.params.id;

    // 1) Find all employees in this department
    const employees = await Employee.find({ department: deptId });

    // 2) Collect their ids and userIds
    const employeeIds = employees.map((emp) => emp._id);
    const userIds = employees.map((emp) => emp.userId).filter(Boolean);

    // 3) ✅ Delete all salary records for these employees
    await Salary.deleteMany({ employee: { $in: employeeIds } });

    // 4) ✅ Delete all leave records for these employees
    await Leave.deleteMany({ employee: { $in: employeeIds } });

    // 5) ✅ Delete all employees in this department
    await Employee.deleteMany({ _id: { $in: employeeIds } });

    // 6) ✅ Delete all linked user accounts (login)
    await User.deleteMany({ _id: { $in: userIds } });

    // 7) ✅ Finally delete the department itself
    await Department.findByIdAndDelete(deptId);

    res.json({
      success: true,
      message: "Department is deleted.",
    });
  } catch (e) {
    console.error("deleteDepartment error:", e);
    res.status(500).json({ success: false, error: "Delete failed" });
  }
};
