const mongoose = require("mongoose");

const vitalSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  nurse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  temperature: Number,
  blood_pressure: String,
  pulse: Number,
  respiratory_rate: Number,
  height: Number,
  weight: Number,
  age: String,
  notes: String,
  recorded_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Vital || mongoose.model("Vital", vitalSchema);
