import Leave from "../models/leave.js";
import Employee from "../models/employee.js";

// POST /api/leave
export const addLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, description } = req.body;

    // 1) Basic validation
    if (!leaveType || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: "leaveType, fromDate and toDate are required",
      });
    }

    // 2) Identify the logged-in user
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: user not found in request",
      });
    }

    // 3) Find the Employee document for this user
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee profile not found for this user",
      });
    }

    // 4) Create leave doc
    const newLeave = new Leave({
      employee: employee._id,
      leaveType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      description,
      // status defaults to "Pending"
      // appliedAt defaults to now
    });

    await newLeave.save();

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      leave: newLeave,
    });
  } catch (error) {
    console.error("addLeave error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while creating leave request",
    });
  }
};

// GET /api/leave/my
export const getMyLeaves = async (req, res) => {
  try {
    // 2) Identify the logged-in user
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: user not found in request",
      });
    }

    // Find employee by userId
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee profile not found for this user",
      });
    }

    // Get all leaves for this employee, newest first
    const leaves = await Leave.find({ employee: employee._id }).sort({
      appliedAt: -1,
    });

    return res.status(200).json({
      success: true,
      leaves,
    });
  } catch (error) {
    console.error("getMyLeaves error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error fetching leaves",
    });
  }
};

// GET /api/leave/admin
// Return all leaves with employee + user + department populated
export const getAdminLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate({
        path: "employee",
        populate: [
          {
            path: "userId",
            select: "name email avatar", // employee user details
          },
          {
            path: "department",
            select: "dept_name", // department name only
          },
        ],
      })
      .sort({ appliedAt: 1 }); // newest first

    return res.status(200).json({
      success: true,
      leaves,
    });
  } catch (error) {
    console.error("getAdminLeaves error:", error);
    return res.status(500).json({
      success: false,
      error: "Error fetching leave requests",
    });
  }
};

// GET /api/leave/:id
export const getSingleLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findById(id).populate({
      path: "employee",
      populate: [
        { path: "userId", select: "name email avatar" },
        { path: "department", select: "dept_name" },
      ],
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave request not found",
      });
    }

    return res.status(200).json({
      success: true,
      leave,
    });
  } catch (error) {
    console.error("getSingleLeave error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching leave",
    });
  }
};

// PUT /api/leave/:id/status
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "Approved" or "Rejected"

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status, isSeenByEmployee: false }, // reset notification flag
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Leave ${status}`,
      leave,
    });
  } catch (error) {
    console.error("updateLeaveStatus error:", error);
    res.status(500).json({
      success: false,
      error: "Server error updating leave status",
    });
  }
};

// GET /api/leave/my/notifications
export const getMyLeaveNotifications = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    // find employee doc for this user
    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee profile not found",
      });
    }

    const leaves = await Leave.find({
      employee: employee._id,
      status: { $in: ["Approved", "Rejected"] },
      isSeenByEmployee: false,
    })
      .sort({ updatedAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      notifications: leaves,
      unreadCount: leaves.length,
    });
  } catch (error) {
    console.error("getMyLeaveNotifications error:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching leave notifications",
    });
  }
};

// PATCH /api/leave/my/notifications/mark-seen
export const markMyLeaveNotificationsSeen = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const employee = await Employee.findOne({ userId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee profile not found",
      });
    }

    await Leave.updateMany(
      {
        employee: employee._id,
        status: { $in: ["Approved", "Rejected"] },
        isSeenByEmployee: false,
      },
      { $set: { isSeenByEmployee: true } }
    );

    res.status(200).json({
      success: true,
      message: "Notifications marked as seen",
    });
  } catch (error) {
    console.error("markMyLeaveNotificationsSeen error:", error);
    res.status(500).json({
      success: false,
      error: "Error updating notifications",
    });
  }
};
