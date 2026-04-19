const Case = require("../models/Case");
const Evidence = require("../models/Evidence");

// ==============================
// Create Case
// ==============================
exports.createCase = async (req, res, next) => {
  try {

    const { caseNumber, title, description } = req.body;

    const newCase = await Case.create({
      caseNumber,
      title,
      description,
      officer: req.user._id
    });

    res.status(201).json({
      status: "success",
      data: newCase
    });

  } catch (err) {
    next(err);
  }
};


// ==============================
// Get All Cases
// ==============================
exports.getCases = async (req, res, next) => {
  try {

    const cases = await Case.find()
      .populate("officer", "name email role")
      .sort({ createdAt: -1 });

    // 🔥 FIX: direct array भेजो
    res.status(200).json(cases);

  } catch (err) {
    next(err);
  }
};


// ==============================
// Get Single Case
// ==============================
exports.getSingleCase = async (req, res, next) => {
  try {

    const caseData = await Case.findById(req.params.id)
      .populate("officer", "name email role");

    if (!caseData) {
      return res.status(404).json({
        status: "fail",
        message: "Case not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: caseData
    });

  } catch (err) {
    next(err);
  }
};


// ==============================
// Delete Case
// ==============================
exports.deleteCase = async (req, res, next) => {
  try {

    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        status: "fail",
        message: "Case not found"
      });
    }

    await caseData.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Case deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};


// ==============================
// Get Evidence By Case
// ==============================
exports.getCaseEvidence = async (req, res, next) => {
  try {

    const evidence = await Evidence.find({
  case: req.params.caseId
})
.populate("uploadedBy", "name email role")
.populate("case", "_id caseNumber title")
.sort({ createdAt: -1 });

res.json(evidence);

  } catch (err) {
    next(err);
  }
};