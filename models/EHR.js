const mongoose = require("mongoose");

const ehrSchema = new mongoose.Schema(
  {
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
    date: {
      type: Date,
      default: Date.now,
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    treatment: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    vitals: {
      bloodPressure: { type: String },
      heartRate: { type: String },
      temperature: { type: String },
      respiratoryRate: { type: String },
      oxygenSaturation: { type: String },
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],
  },
  { timestamps: true }
);

const EHR = mongoose.model("EHR", ehrSchema);

module.exports = EHR;
