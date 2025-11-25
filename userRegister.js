import User from "./models/User.js";
import bcrypt from "bcrypt";
import connectDB from "./db/db.js";

const userRegister = async () => {
  connectDB();
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const newUser = new User({
      name: "Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin",
    });
    await newUser.save();
  } catch (error) {
    console.log(error);
  }
};

userRegister();
