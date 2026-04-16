const express = require("express");
const router = express.Router();
const multer = require("multer");

const evidenceController = require("../controllers/evidenceController");
const { protect, allowRoles } = require("../middleware/authMiddleware"); // ✅ ONLY THIS

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

router.post("/upload", upload.single("file"), protect, allowRoles("admin", "officer"), evidenceController.uploadEvidence);

router.get("/all", protect, allowRoles("admin","officer","forensic","viewer"), evidenceController.getAllEvidence);

router.get("/search", protect, allowRoles("admin","officer","forensic","viewer"), evidenceController.searchEvidence);

router.get("/case/:caseId", protect, allowRoles("admin","officer","forensic","viewer"), evidenceController.getEvidenceByCase);

router.put("/verify/:id", protect, allowRoles("admin","forensic","officer"), evidenceController.verifyEvidence);

router.get("/download/:id", protect, allowRoles("admin","officer","forensic","viewer"), evidenceController.downloadEvidence);

router.get("/certificate/:id", protect, allowRoles("admin","officer","forensic"), evidenceController.generateCertificate);

router.delete("/:id", protect, allowRoles("admin"), evidenceController.deleteEvidence);

module.exports = router;