const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ IMPORTANT IMPORT (MISSING था)
const Evidence = require("../models/Evidence");

const evidenceController = require("../controllers/evidenceController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// ================= UPLOAD FOLDER =================
const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ================= MULTER =================
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

// 🔹 Get Evidence by Case ID (🔥 NEW MAIN FEATURE)
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

// 🔹 Verify
router.put(
  "/verify/:id",
  protect,
  allowRoles("admin", "forensic", "officer"),
  evidenceController.verifyEvidence
);

// 🔹 Download
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