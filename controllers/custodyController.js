const Custody = require("../models/Custody");

exports.getEvidenceTimeline = async (req, res) => {
  try {
    const data = await Custody.find({
      evidence: req.params.id
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({
      message: "Timeline fetch failed ❌"
    });
  }
};