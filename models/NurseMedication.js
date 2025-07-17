const mongoose = require("mongoose");

const nurseMedicationSchema = new mongoose.Schema(
  {
    nurse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    medication_name: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "administered"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.NurseMedication ||
  mongoose.model("NurseMedication", nurseMedicationSchema);
