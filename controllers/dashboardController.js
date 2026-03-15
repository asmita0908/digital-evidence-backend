const Case = require("../models/Case");
const Evidence = require("../models/Evidence");
const User = require("../models/User");
const CustodyLog = require("../models/CustodyLog");

exports.getDashboardStats = async (req, res, next) => {
  try {

    // ADMIN DASHBOARD
    if (req.user.role === "admin") {

      const totalCases = await Case.countDocuments();
      const totalEvidence = await Evidence.countDocuments();
      const totalOfficers = await User.countDocuments({ role: "officer" });
      const totalLogs = await CustodyLog.countDocuments();

      return res.status(200).json({
        status: "success",
        role: "admin",
        data: {
          totalCases,
          totalEvidence,
          totalOfficers,
          totalLogs
        }
      });
    }

    // OFFICER DASHBOARD
    if (req.user.role === "officer") {

      const myCases = await Case.countDocuments({ officer: req.user._id });
      const myEvidence = await Evidence.countDocuments({ user: req.user._id });

      return res.status(200).json({
        status: "success",
        role: "officer",
        data: {
          myCases,
          myEvidence
        }
      });
    }

  } catch (err) {
    next(err);
  }
};