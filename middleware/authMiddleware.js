import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function verifyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "No token provided" });
    }

    // verify throws on invalid/expired token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // use the field you actually sign: _id OR id
    const userId = decoded._id || decoded.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    req.user = user;
    return next();
  } catch (err) {
    // Provide clear auth errors instead of generic 500
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    console.error("verifyUser error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
