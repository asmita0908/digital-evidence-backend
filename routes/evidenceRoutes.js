const express = require("express");
const router = express.Router();
const multer = require("multer");

// ❌ REMOVE local storage wala path + fs
// const path = require("path");
// const fs = require("fs");

// ✅ MODEL
const Evidence = require("../models/Evidence");

// ✅ CONTROLLER
const evidenceController = require("../controllers/evidenceController");

// ✅ MIDDLEWARE
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// ================= CLOUDINARY SETUP =================
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// 🔥 CLOUD STORAGE (FINAL)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "evidence_files",   // Cloudinary folder
    resource_type: "auto"       // image, video, pdf sab support
  }
});

const upload = multer({ storage });

// ================= ROUTES =================

// 🔹 Upload Evidence
router.post(
  "/upload",
  protect,
  allowRoles("admin", "officer"),
  upload.single("file"),
  evidenceController.uploadEvidence
);

// 🔹 Get All Evidence
router.get(
  "/all",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  evidenceController.getAllEvidence
);

// 🔹 Search (keyword)
router.get(
  "/search",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  evidenceController.searchEvidence
);

// 🔹 Get Evidence by Case ID (🔥 MAIN FEATURE)
router.get(
  "/case/:caseId",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  async (req, res) => {
    try {
      const evidences = await Evidence.find({ case: req.params.caseId })
        .populate("uploadedBy", "name")
        .populate("case", "title");

      res.json(evidences);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching case evidence" });
    }
  }
);

// 🔹 Verify Evidence
router.put(
  "/verify/:id",
  protect,
  allowRoles("admin", "forensic", "officer"),
  evidenceController.verifyEvidence
);

// 🔹 Download Evidence
router.get(
  "/download/:id",
  protect,
  allowRoles("admin", "officer", "forensic", "viewer"),
  evidenceController.downloadEvidence
);

// 🔹 Certificate
router.get(
  "/certificate/:id",
  protect,
  allowRoles("admin", "officer", "forensic"),
  evidenceController.generateCertificate
);

module.exports = router;