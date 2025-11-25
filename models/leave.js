import mongoose from "mongoose";

const { Schema } = mongoose;

const leaveSchema = new Schema({
  // Which employee applied for this leave
  employee: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },

  // Leave type - limited to 4 kinds
  leaveType: {
    type: String,
    enum: ["Annual Leave", "Sick Leave", "Casual Leave", "Others"],
    required: true,
  },

  // From which date
  fromDate: {
    type: Date,
    required: true,
  },

  // To which date
  toDate: {
    type: Date,
    required: true,
  },

  // Optional description / reason
  description: {
    type: String,
    trim: true,
  },

  // Status: pending by default
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  isSeenByEmployee: {
    type: Boolean,
    default: false,
  },
  // When the leave was applied (we can also use timestamps)
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
