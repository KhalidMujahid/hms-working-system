const mongoose = require("mongoose");

const labReportSchema = new mongoose.Schema({
  patient_name: String,
  test_type: String,
  result: String,
  status: { type: String, enum: ["Completed", "Pending"], default: "Pending" },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LabReport", labReportSchema);
