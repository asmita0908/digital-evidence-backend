const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");

/// 🔥 ADD THIS IMPORT (TOP में)
const { protect, allowRoles } = require("../middleware/authMiddleware");



// ===============================
// LOGIN
// ===============================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    accessToken,
    refreshToken,
    role: user.role,
    is2FAEnabled: user.is2FAEnabled
  });
});

// ===============================
// REFRESH TOKEN
// ===============================
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "No token" });

  const user = await User.findOne({ refreshToken });
  if (!user)
    return res.status(403).json({ message: "Invalid refresh token" });

  const accessToken = generateAccessToken(user._id, user.role);

  res.json({ accessToken });
});
// ===============================
// GET ALL USERS (ADMIN)
// ===============================
router.get("/", protect, allowRoles("admin"), async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});


// ===============================
// CREATE USER (ADMIN)
// ===============================
router.post("/", protect, allowRoles("admin"), async (req, res) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role
  });

  res.json({ message: "User created ✅" });
});


// ===============================
// UPDATE ROLE
// ===============================
router.put("/:id", protect, allowRoles("admin"), async (req, res) => {
  const { role } = req.body;

  await User.findByIdAndUpdate(req.params.id, { role });

  res.json({ message: "Role updated ✅" });
});


// ===============================
// DELETE USER
// ===============================
router.delete("/:id", protect, allowRoles("admin"), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);

  res.json({ message: "User deleted ✅" });
});

module.exports = router;