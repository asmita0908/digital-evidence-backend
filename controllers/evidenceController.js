const Evidence = require("../models/Evidence");
const Log = require("../models/Log");
const Custody = require("../models/Custody");
const Case = require("../models/Case");

const crypto = require("crypto");
const fs = require("fs");
const PDFDocument = require("pdfkit");


// ===============================
// Upload Evidence
// ===============================

eexports.uploadEvidence = async (req, res) => {
  try {
    const { title, description, caseId } = req.body;

    if (!caseId) {
      return res.status(400).json({
        message: "Case ID required ❌"
      });
    }

    const filePath = req.file.path.replace(/\\/g, "/");

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const fileBuffer = fs.readFileSync(filePath);

    const fileHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
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

    // 🔥 CASE LINK
    await Case.findByIdAndUpdate(caseId, {
      $push: { evidences: evidence._id }
    });

    res.json({
      message: "Evidence Uploaded",
      evidence
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Upload failed" });
  }
};
// ===============================
// Search Evidence
// ===============================

exports.searchEvidence = async (req,res)=>{

try{

const keyword = req.query.keyword;

const evidences = await Evidence.find({
$or:[
{title:{$regex:keyword,$options:"i"}},
{description:{$regex:keyword,$options:"i"}}
]
});

res.json(evidences);

}catch(err){

res.status(500).json({
message:"Search failed"
});

}

};


// ===============================
// Verify Evidence
// ===============================

exports.verifyEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({
        message: "Evidence not found"
      });
    }

    // ❗ SAFE CHECK
    if (!fs.existsSync(evidence.filePath)) {
      return res.status(400).json({
        message: "File missing"
      });
    }

    const fileBuffer = fs.readFileSync(evidence.filePath);

    const newHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    let tampered = false;

    if (newHash !== evidence.fileHash) {
      evidence.isTampered = true;
      tampered = true;
    } else {
      evidence.isTampered = false;
    }

    await evidence.save();

    res.json({
      tampered,
      message: tampered ? "Tampered ❌" : "Safe ✅"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Verification Failed"
    });
  }
};


// ===============================
// Download Evidence
// ===============================

exports.downloadEvidence = async (req, res) => {
  try {
    const io = req.app.get("io");

    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({
        message: "Evidence not found"
      });
    }

    // ✅ FIX: Absolute path banana
    const filePath = evidence.filePath;

    // ✅ FIX: file exist check
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File not found on server"
      });
    }

    // ✅ logs
    await Log.create({
      action: "Evidence Downloaded",
      user: req.user.id,
      evidence: evidence._id
    });

    await Custody.create({
      action: "Evidence Downloaded",
      user: req.user.id,
      evidence: evidence._id
    });

    io.emit("evidenceActivity", {
      type: "DOWNLOAD",
      message: "Evidence Downloaded",
      evidenceId: evidence._id
    });

    // ✅ FINAL DOWNLOAD
    res.download(filePath);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Download failed"
    });
  }
};


// ===============================
// Certificate
// ===============================

exports.generateCertificate = async (req,res)=>{

try{

const evidence = await Evidence.findById(req.params.id)
.populate("uploadedBy","name email");

const doc = new PDFDocument();

res.setHeader("Content-Type","application/pdf");

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

}catch(err){

res.status(500).json({
message:"Certificate generation failed"
});

}

};
// ===============================
// Get All Evidence
// ===============================

exports.getAllEvidence = async (req,res)=>{

try{

const evidences = await Evidence.find()
.populate("uploadedBy","name email")
.populate("case","caseNumber title");

res.json(evidences);

}catch(err){

console.log(err);

res.status(500).json({
message:"Error fetching evidence"
});

}

};
exports.deleteEvidence = async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);

    if (!evidence) {
      return res.status(404).json({ message: "Not found" });
    }

    if (fs.existsSync(evidence.filePath)) {
      fs.unlinkSync(evidence.filePath);
    }

    await evidence.deleteOne();

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};
exports.getEvidenceByCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    const data = await Evidence.find({ case: caseId });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Error fetching case evidence" });
  }
};