const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const { getDashboardStats } = require("../controllers/dashboardController");

router.get(
  "/",
  protect,
  allowRoles("admin", "officer"),
  controller
);

module.exports = router;