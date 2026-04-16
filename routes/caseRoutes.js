const express = require("express");
const router = express.Router();

const { protect, allowRoles } = require("../middleware/authMiddleware"); // ✅ ONLY THIS

const {
  createCase,
  getCases,
  getCaseEvidence,
  getSingleCase,
  deleteCase
} = require("../controllers/caseController");

// Create
router.post("/", protect, allowRoles("admin","officer"), createCase);

// Get all
router.get("/", protect, getCases);

// Get single
router.get("/:id", protect, getSingleCase);

// Get evidence
router.get("/:caseId/evidence", protect, getCaseEvidence);

// Delete
router.delete("/:id", protect, allowRoles("admin"), deleteCase); // ✅ FIXED

module.exports = router;