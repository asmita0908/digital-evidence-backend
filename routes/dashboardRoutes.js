const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const { getDashboardStats } = require("../controllers/dashboardController");

router.get(
  "/stats",
  protect,
  authorize("admin", "officer"),
  getDashboardStats
);

module.exports = router;