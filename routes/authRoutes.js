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
// 🔐 LOGIN (🔥 FIXED)
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

    // 2FA check
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

    // 🔥 FINAL RESPONSE (IMPORTANT)
    res.json({
      status: "success",
      token: accessToken,   // ✅ renamed
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role     // ✅ real role
      }
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
      token: accessToken,
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

  const secret = speakeasy.generateSecret({ length: 20 });

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
    token: accessToken,
    refreshToken,
  });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User not found ❌" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.resetOTP = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min

    await user.save();

    console.log("🔐 OTP:", otp); // check terminal

    res.json({ message: "OTP sent ✅ (check console)" });

  } catch (err) {
    res.status(500).json({ message: "Error sending OTP" });
  }
});


router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "User not found ❌" });
    }

    user.password = newPassword; // 🔥 auto hash ho jayega (pre-save)
    user.resetOTP = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful ✅" });

  } catch (err) {
    res.status(500).json({ message: "Reset failed" });
  }
});


router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (
      !user ||
      user.resetOTP != otp ||
      user.otpExpiry < Date.now()
    ) {
      return res.json({ message: "Invalid or expired OTP ❌" });
    }

    res.json({ message: "OTP verified ✅" });

  } catch (err) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

router.get("/webauthn/register-options", protect, async (req, res) => {

  const options = generateRegistrationOptions({
    rpName: "Evidence System",
    rpID: "localhost",
    userID: req.user._id.toString(),
    userName: req.user.email
  });

  req.session = { challenge: options.challenge };

  res.json(options);
});

router.post("/webauthn/register", protect, async (req, res) => {

  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge: req.session.challenge,
    expectedOrigin: "http://localhost:5500",
    expectedRPID: "localhost"
  });

  if (verification.verified) {
    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        webauthnCredentials: {
          credentialID,
          publicKey: credentialPublicKey,
          counter
        }
      }
    });
  }

  res.json({ success: true });
});

router.get("/webauthn/login-options", async (req, res) => {

  const user = await User.findOne({ email: req.query.email });

  const options = generateAuthenticationOptions({
    allowCredentials: user.webauthnCredentials.map(c => ({
      id: c.credentialID,
      type: "public-key"
    }))
  });

  req.session = { challenge: options.challenge };

  res.json(options);
});

router.post("/webauthn/login", async (req, res) => {

  const user = await User.findOne({ email: req.body.email });

  const credential = user.webauthnCredentials[0];

  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: req.session.challenge,
    expectedOrigin: "http://localhost:5500",
    expectedRPID: "localhost",
    authenticator: credential
  });

  if (verification.verified) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});
module.exports = router;