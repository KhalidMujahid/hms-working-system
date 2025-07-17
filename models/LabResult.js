const mongoose = require("mongoose");

const labResultSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  test_type: { type: String, required: true },
  date_requested: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  result: { type: String },
});

module.exports = mongoose.model("LabResult", labResultSchema);
