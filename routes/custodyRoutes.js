const express = require("express");
const router = express.Router();

const {getEvidenceTimeline} = require("../controllers/custodyController");

router.get("/timeline/:id",getEvidenceTimeline);

module.exports = router;