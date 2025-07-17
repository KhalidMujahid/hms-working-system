const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patient_id: {
      type: Number,
      required: true,
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: "NG" },
    },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String },
    },
    medicalHistory: [
      {
        condition: String,
        diagnosedDate: Date,
        notes: String,
      },
    ],
    allergies: [String],
    currentMedications: [
      {
        name: String,
        dosage: String,
        frequency: String,
      },
    ],
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    insurance: {
      provider: { type: String },
      policyNumber: { type: String },
      groupNumber: { type: String },
    },
    insured: {
      type: Boolean,
      default: false,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
