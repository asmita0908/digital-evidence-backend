const Evidence = require("../models/Evidence");
const Log = require("../models/Log");
const Custody = require("../models/Custody");
const Case = require("../models/Case");

const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const https = require("https");

// ===============================
// Upload Evidence (CLOUDINARY)
// ===============================

exports.uploadEvidence = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { title, description, caseId } = req.body;

    if (!title || !description || !caseId) {
      return res.status(400).json({ message: "All fields required ❌" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File missing ❌" });
    }

    // ✅ Cloudinary data (IMPORTANT)
    console.log("FILE OBJECT:", req.file);

    const fileUrl = req.file?.path || null;

    console.log("FILE URL:", fileUrl);

if (!fileUrl) {
  return res.status(500).json({ message: "File upload failed ❌" });
}
    const filePath = req.file.filename;

    // ✅ HASH FIX (IMPORTANT 🔥)
    const fileHash = crypto
      .createHash("sha256")
      .update(fileUrl)
      .digest("hex");

    const evidence = await Evidence.create({
      title,
      description,
      fileUrl,
      filePath,
      fileHash,
      uploadedBy: req.user.id,
      case: caseId
    });

// 🔥 ADD THIS
    await Custody.create({
    evidence: evidence._id,
    action: "Uploaded",
    performedBy: req.user.id
    });

    res.json({
      message: "Upload success ✅",
      evidence
    });

  } catch (err) {
    console.log("❌ ERROR:", err);
    res.status(500).json({
      message: err.message || "Upload failed ❌"
    });
  }
};

// ===============================
// Verify Evidence (Cloud)
// ===============================

exports.verifyEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({
        message: "Evidence not found ❌"
      });
    }

    // ✅ SAME HASH LOGIC AS UPLOAD
    const newHash = crypto
      .createHash("sha256")
      .update(evidence.fileUrl)
      .digest("hex");

    const tampered = newHash !== evidence.fileHash;

    res.json({
      tampered,
      message: tampered ? "Tampered ❌" : "Safe ✅"
    });

  } catch (err) {
    console.log("VERIFY ERROR:", err);
    res.status(500).json({
      message: "Verification Failed ❌"
    });
  }
};
// ===============================
// Download (Cloud)
// ===============================

exports.downloadEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);

    if (!evidence || !evidence.fileUrl) {
      return res.status(404).json({
        message: "Evidence not found ❌"
      });
    }

    https.get(evidence.fileUrl, (fileRes) => {
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=evidence"
      );
      fileRes.pipe(res);
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Download failed ❌"
    });
  }
};

// ===============================
// Certificate
// ===============================

exports.generateCertificate = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id)
      .populate("uploadedBy", "name email");

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=evidence_certificate.pdf"
    );

    doc.pipe(res);

    doc.fontSize(22).text("Evidence Verification Certificate");
    doc.moveDown();

    doc.text(`Evidence ID: ${evidence._id}`);
    doc.text(`Title: ${evidence.title}`);
    doc.text(`Hash: ${evidence.fileHash}`);
    doc.text(`Uploaded By: ${evidence.uploadedBy.name}`);
    doc.text(`Verification Date: ${new Date()}`);

    doc.end();

  } catch (err) {
    res.status(500).json({
      message: "Certificate generation failed"
    });
  }
};

// ===============================
// Get All Evidence
// ===============================

exports.getAllEvidence = async (req, res) => {
  try {
    const evidences = await Evidence.find()
      .populate("uploadedBy", "name email")
      .populate("case", "_id caseNumber title");

    res.json(evidences);

  } catch (err) {
    res.status(500).json({
      message: "Error fetching evidence"
    });
  }
};
// ===============================
// Search Evidence ✅ (MISSING FIX)
// ===============================
exports.searchEvidence = async (req, res) => {
  try {
    const keyword = req.query.keyword;

    const evidences = await Evidence.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ]
    });

    res.json(evidences);

  } catch (err) {
    res.status(500).json({
      message: "Search failed"
    });
  }
};

// ===============================
// Get Evidence By Case ✅ (BEST PRACTICE)
// ===============================
exports.getEvidenceByCase = async (req, res) => {
  try {
    const evidences = await Evidence.find({ case: req.params.caseId })
      .populate("uploadedBy", "name")
      .populate("case", "title");

    res.json(evidences);

  } catch (err) {
    res.status(500).json({
      message: "Error fetching case evidence"
    });
  }
};
exports.deleteEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({ message: "Not found ❌" });
    }

    await evidence.deleteOne();

    res.json({ message: "Evidence deleted ✅" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed ❌" });
  }
};