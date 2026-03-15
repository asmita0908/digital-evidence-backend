const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
{
  caseNumber: {
    type: String,
    required: true,
    unique: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  status: {
    type: String,
    enum: ["open", "investigating", "closed"],
    default: "open"
  },

  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  evidences: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evidence"
    }
  ]

},
{ timestamps: true }
);

module.exports = mongoose.model("Case", caseSchema);