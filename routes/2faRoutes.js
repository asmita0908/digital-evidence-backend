const express = require("express");
const router = express.Router();
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// 🔐 Generate Secret
router.post("/generate", protect, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: "EvidenceSystem",
    });

    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: secret.base32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      message: "2FA secret generated",
      qrCode,
      manualCode: secret.base32,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔐 Verify & Enable
router.post("/verify", protect, async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user._id);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.is2FAEnabled = true;
    await user.save();

    res.json({ message: "2FA enabled successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;