const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ================= PROTECT =================
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};

// ================= ROLE =================
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: `Access denied for role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  allowRoles, // 🔥 IMPORTANT
};