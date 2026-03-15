const express = require("express");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");

const router = express.Router();


// ======================================
// 📝 REGISTER
// ======================================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    res.json({
      status: "success",
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});


// ======================================
// 🔐 LOGIN
// ======================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid password",
      });
    }

    // अगर 2FA enabled है
    if (user.is2FAEnabled) {
      return res.json({
        status: "success",
        twoFARequired: true,
        userId: user._id,
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      status: "success",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});


// ======================================
// 🔄 REFRESH TOKEN
// ======================================
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token",
      });
    }

    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(403).json({
        message: "Invalid refresh token",
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);

    res.json({
      accessToken,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// ======================================
// 🔐 GENERATE 2FA
// ======================================
router.post("/generate-2fa/:id", async (req, res) => {

  const user = await User.findById(req.params.id);

  const secret = speakeasy.generateSecret({
    length: 20,
  });

  user.twoFactorSecret = secret.base32;

  await user.save();

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    message: "Scan QR in Google Authenticator",
    qrCode,
    manualCode: secret.base32,
  });
});


// ======================================
// 🔑 VERIFY 2FA
// ======================================
router.post("/verify-2fa/:id", async (req, res) => {

  const { token } = req.body;

  const user = await User.findById(req.params.id);

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!verified) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  user.is2FAEnabled = true;

  await user.save();

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  res.json({
    accessToken,
    refreshToken,
  });
});

module.exports = router;