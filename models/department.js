import mongoose from "mongoose";
const { Schema } = mongoose;

const departmentSchema = new Schema({
  dept_name: { type: String, required: true },
  dept_head: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Department = mongoose.model("Department", departmentSchema);
export default Department;
