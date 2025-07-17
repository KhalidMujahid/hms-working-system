const mongoose = require("mongoose");

const labRequestSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  test_type: String,
  result: String,
  requested_at: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LabRequest", labRequestSchema);
