const mongoose = require("mongoose");

const dispensedMedicationSchema = new mongoose.Schema(
  {
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantityDispensed: {
      type: Number,
      required: true,
      min: 1,
    },
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
    dispensed_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DispensedMedication",
  dispensedMedicationSchema
);
