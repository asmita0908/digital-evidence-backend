const mongoose = require("mongoose");

const custodySchema = new mongoose.Schema(
  {
    evidence: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evidence",
      required: true,
    },

    action: {
      type: String,
      enum: ["UPLOAD", "VIEW", "VERIFY", "DELETE","DOWNLOAD"],
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notes: {
      type: String,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustodyLog", custodySchema);