const express = require("express");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { protect } = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");

const {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse
} = require("@simplewebauthn/server");

const router = express.Router();
// ================= EMAIL SETUP =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS
  }
});


// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    await User.create({ name, email, password, role });

    res.json({ message: "User registered ✅" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: "User not found ❌" });

    const isMatch = await user.matchPassword(password);

    if (!isMatch) return res.status(401).json({ message: "Wrong password ❌" });

    if (user.is2FAEnabled) {
      return res.json({
        twoFARequired: true,
        userId: user._id
      });
    }

    const token = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= 2FA GENERATE =================
router.post("/generate-2fa/:id", async (req, res) => {
  const user = await User.findById(req.params.id);

  const secret = speakeasy.generateSecret({ length: 20 });

  user.twoFactorSecret = secret.base32;
  await user.save();

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    qrCode,
    manualCode: secret.base32
  });
});


// ================= 2FA VERIFY =================
router.post("/verify-2fa/:id", async (req, res) => {
  const { token } = req.body;

  const user = await User.findById(req.params.id);

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 1
  });

  if (!verified) {
    return res.status(400).json({ message: "Invalid OTP ❌" });
  }

  user.is2FAEnabled = true;
  await user.save();

  const accessToken = generateAccessToken(user._id, user.role);

  res.json({ token: accessToken });
});


// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return res.json({ message: "User not found ❌" });

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.resetOTP = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    // ✅ EMAIL SEND HERE
    await transporter.sendMail({
      from: "your_email@gmail.com",
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}`
    });

    res.json({ message: "OTP sent to email ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error sending OTP ❌" });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (
    !user ||
    user.resetOTP != otp ||
    user.otpExpiry < Date.now()
  ) {
    return res.json({ message: "Invalid OTP ❌" });
  }

  res.json({ message: "OTP verified ✅" });
});


// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (
    !user ||
    user.resetOTP != otp ||
    user.otpExpiry < Date.now()
  ) {
    return res.json({ message: "Invalid OTP ❌" });
  }

  user.password = newPassword;
  user.resetOTP = null;
  user.otpExpiry = null;

  await user.save();

  res.json({ message: "Password reset ✅" });
});


// ================= WEBAUTHN REGISTER =================
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


// ================= WEBAUTHN VERIFY REGISTER =================
router.post("/webauthn/register", protect, async (req, res) => {

  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge: req.session?.challenge,
    expectedOrigin: "http://localhost:5500",
    expectedRPID: "localhost"
  });

  if (verification.verified) {

    const { credentialPublicKey, credentialID, counter } =
      verification.registrationInfo;

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


// ================= WEBAUTHN LOGIN OPTIONS =================
router.get("/webauthn/login-options", async (req, res) => {

  const user = await User.findOne({ email: req.query.email });

  if (!user || !user.webauthnCredentials?.length) {
    return res.json({ message: "No fingerprint registered ❌" });
  }

  const options = generateAuthenticationOptions({
    allowCredentials: user.webauthnCredentials.map(c => ({
      id: c.credentialID,
      type: "public-key"
    }))
  });

  req.session = { challenge: options.challenge };

  res.json(options);
});


// ================= WEBAUTHN LOGIN =================
router.post("/webauthn/login", async (req, res) => {

  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const credential = user.webauthnCredentials[0];

  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: req.session?.challenge,
    expectedOrigin: "http://localhost:5500",
    expectedRPID: "localhost",
    authenticator: credential
  });

  if (!verification.verified) {
    return res.status(401).json({ message: "Fingerprint failed ❌" });
  }

  const token = generateAccessToken(user._id, user.role);

  res.json({ success: true, token });
});


module.exports = router;