const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ========================================
// 🔐 PROTECT MIDDLEWARE (Authentication)
// ========================================
const protect = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Get token from header
    // 1️⃣ Get token from header OR query (IMPORTANT 🔥)
if (
  req.headers.authorization &&
  req.headers.authorization.startsWith("Bearer ")
) {
  token = req.headers.authorization.split(" ")[1];
} else if (req.query.token) {
  token = req.query.token;  // ✅ ADD THIS
}
    // 2️⃣ If no token
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access denied. No token provided.",
      });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Get user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    // 5️⃣ Attach user to request
    req.user = user;

    next();

  } catch (error) {

    // Token expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired. Please login again.",
      });
    }

    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }
};

// ========================================
// 🛡 ROLE BASED AUTHORIZATION
// ========================================
const authorize = (...roles) => {
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
        message: `Access denied. Role '${req.user.role}' not allowed.`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};