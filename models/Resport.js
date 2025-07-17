const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  report_type: {
    type: String,
    enum: ["Vitals", "Medication", "Appointment"],
    required: true,
  },
  details: { type: String, required: true },
  date: { type: String, required: true },
});

module.exports = mongoose.model("Report", reportSchema);
