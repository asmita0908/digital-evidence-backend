const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createCase,
  getCases,
  getCaseEvidence,
  getSingleCase,
  deleteCase
} = require("../controllers/caseController");

// ==============================
// Create Case
// ==============================
router.post(
  "/",
  protect,
  authorize("admin", "officer"),
  createCase
);

// ==============================
// Get All Cases
// ==============================
router.get(
  "/",
  protect,
  getCases
);

// ==============================
// Get Single Case
// ==============================
router.get(
  "/:id",
  protect,
  getSingleCase
);

// ==============================
// Get Evidence By Case
// ==============================
router.get(
  "/:caseId/evidence",
  protect,
  getCaseEvidence
);

// ==============================
// Delete Case (Admin Only)
// ==============================
router.delete(
  "/:id",
  protect,
  allowRoles("admin"),
  caseController.deleteCase
);

module.exports = router;