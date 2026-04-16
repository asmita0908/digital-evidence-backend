const express = require("express");
const router = express.Router();

const { protect, allowRoles } = require("../middleware/authMiddleware");
const { getDashboardStats } = require("../controllers/dashboardController");

router.get(
  "/",
  protect,
  allowRoles("admin", "officer"),
  getDashboardStats // ✅ FIXED
);

module.exports = router;