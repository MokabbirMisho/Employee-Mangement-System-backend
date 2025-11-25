import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs";
import path from "path";
import Employee from "../models/employee.js";
import User from "../models/User.js";
import Salary from "../models/salary.js";
import Leave from "../models/leave.js";

// 2) Multer disk storage for LOCAL upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

export const addEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      employeeId,
      dob,
      gender,
      maritalStatus,
      designation,
      department,
      salary,
    } = req.body;

    // unique email
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: "Email already in use" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // avatar filename from local upload
    const avatarFilename = req.file ? req.file.filename : "";

    // create user (store avatar filename on user profile as you designed)
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      avatar: avatarFilename,
    });
    const savedUser = await newUser.save();

    // create employee doc linked to user
    const newEmployee = new Employee({
      userId: savedUser._id,
      employeeId,
      dob: dob ? new Date(dob) : undefined,
      gender,
      maritalStatus,
      designation,
      department,
      salary: Number(salary),
    });

    const savedEmployee = await newEmployee.save();

    // ✅ ALSO create initial Salary record so it shows in salary list
    const basic = Number(salary) || 0;

    await Salary.create({
      employee: savedEmployee._id, // ref to Employee
      department, // department _id from body
      employeeId, // "EMP-001"
      basicSalary: basic,
      allowance: 0,
      deductions: 0,
      netSalary: basic,
      payDate: new Date(), // or null if you don't want date filter yet
    });

    return res.status(201).json({ success: true, message: "Employee created" });
  } catch (error) {
    console.error("addEmployee error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "server error in adding employee",
    });
  }
};

// update employee + linked user
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      role,
      dob,
      gender,
      maritalStatus,
      designation,
      department,
    } = req.body;

    // find employee + user
    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found" });
    }

    const user = await User.findById(employee.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Linked user not found" });
    }

    // update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    // avatar (optional)
    if (req.file) {
      // delete old avatar from disk (if exists)
      if (user.avatar) {
        const oldPath = path.join("public", "upload", user.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      // set new avatar filename
      user.avatar = req.file.filename;
    }

    await user.save();

    if (dob) employee.dob = new Date(dob);
    if (gender) employee.gender = gender;
    if (maritalStatus) employee.maritalStatus = maritalStatus;
    if (designation) employee.designation = designation;
    if (department) employee.department = department;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error("updateEmployee error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Server error updating employee" });
  }
};

// GET /api/employee
export const listEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId", "name  email avatar") // user fields
      .populate("department", "dept_name"); // department name only

    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("listEmployees error:", error);
    return res.status(500).json({
      success: false,
      error: "Error fetching employees",
    });
  }
};

// get employee profiles
export const getSingleEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate("userId", "name email avatar")
      .populate("department", "dept_name");

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found" });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error("getSingleEmployee error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching employee",
    });
  }
};

// GET /api/employee/profile
// get logged-in employee profile
export const getMyEmployeeProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: user not found in request",
      });
    }

    // Find employee document linked to this user
    const employee = await Employee.findOne({ userId })
      .populate("userId", "name email avatar role")
      .populate("department", "dept_name");

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee profile not found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error("getMyEmployeeProfile error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error fetching employee profile",
    });
  }
};

// DELETE /api/employee/:id
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found" });
    }

    //  Find the related user (to get avatar filename)
    const user = await User.findById(employee.userId);

    if (user && user.avatar) {
      // Build full path to the avatar file
      const filePath = path.join("public", "uploads", user.avatar);

      // Check if file exists, then delete
      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
          console.log("Deleted avatar file:", filePath);
        } catch (err) {
          console.error("Error deleting avatar file:", err);
          // don't return here – we still want to delete DB docs
        }
      }
    }

    // also delete the linked user if you want
    await User.findByIdAndDelete(employee.userId);
    await Employee.findByIdAndDelete(id);

    // ✅ Delete all salary records for this employee
    await Salary.deleteMany({ employee: id });
    // ✅ Delete all leave records for this employee
    await Leave.deleteMany({ employee: id });

    return res
      .status(200)
      .json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("deleteEmployee error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Error deleting employee" });
  }
};
export { upload };
