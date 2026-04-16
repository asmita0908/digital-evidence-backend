const express = require("express");
const router = express.Router();
const multer = require("multer");

const Evidence = require("../models/Evidence");
const evidenceController = require("../controllers/evidenceController");

const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// ================= CLOUDINARY =================
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "evidence_files",
    resource_type: "auto"
  }
});

const upload = multer({ storage });

// ================= ROUTES =================

// Upload
router.post(
  "/upload",
  upload.single("file"), // 👈 FIRST
  protect,
  allowRoles("admin", "officer"),
  evidenceController.uploadEvidence
);

// Get All
router.get(
  "/all",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  evidenceController.getAllEvidence
);

// Search ✅
router.get(
  "/search",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  evidenceController.searchEvidence
);

// Case-wise evidence ✅ (FIXED)
router.get(
  "/case/:caseId",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  evidenceController.getEvidenceByCase
);

// Verify
router.put(
  "/verify/:id",
  protect,
  allowRoles("admin", "forensic", "officer"),
  evidenceController.verifyEvidence
);

// Download
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
// DELETE Evidence
router.delete(
  "/:id",
  protect,
  allowRoles("admin"), // 🔥 ONLY ADMIN
  evidenceController.deleteEvidence
);

module.exports = router;