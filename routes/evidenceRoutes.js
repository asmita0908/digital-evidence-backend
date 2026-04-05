const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const evidenceController = require("../controllers/evidenceController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// ✅ ensure uploads folder exists
const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ✅ multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ================= ROUTES =================

// Upload Evidence
router.post(
  "/upload",
  protect,
  allowRoles("admin", "officer"),
  upload.single("file"),
  evidenceController.uploadEvidence
);

// Get all evidence
router.get(
  "/all",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  evidenceController.getAllEvidence
);

// Search Evidence
router.get(
  "/search",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  evidenceController.searchEvidence
);

// ✅ VERIFY FIX (officer added)
// ✅ NEW
router.put(
  "/verify/:id",
  protect,
  allowRoles("admin", "forensic", "officer"),
  evidenceController.verifyEvidence
);

// ✅ DOWNLOAD FIX (protection added)
router.get(
  "/download/:id",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  evidenceController.downloadEvidence
);

// Certificate
router.get(
  "/certificate/:id",
  protect,
  allowRoles("admin", "officer", "forensic"),
  evidenceController.generateCertificate
);

module.exports = router;