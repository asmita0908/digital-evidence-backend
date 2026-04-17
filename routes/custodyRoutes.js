const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getEvidenceTimeline } = require("../controllers/custodyController");

router.get("/timeline/:id", protect, getEvidenceTimeline);

module.exports = router;