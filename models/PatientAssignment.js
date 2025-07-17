const mongoose = require("mongoose");

const patientAssignmentSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
      default: () => new Date().setHours(0, 0, 0, 0),
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night"],
      default: "morning",
    },
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PatientAssignment", patientAssignmentSchema);
