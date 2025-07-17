const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
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
    consultation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
    },
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        notes: { type: String, default: "" },
      },
    ],
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "dispensed"],
      default: "pending",
    },
    issued_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.virtual("issuedDateFormatted").get(function () {
  return this.issued_at.toISOString().split("T")[0];
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
