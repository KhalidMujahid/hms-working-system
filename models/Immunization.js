const mongoose = require("mongoose");

const ImmunizationSchema = new mongoose.Schema({
  vaccineName: {
    type: String,
    required: true,
  },
  minimumTargetAge: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    enum: [
      "0.5ml",
      "1ml",
      "2ml",
      "2 drops",
      "5 drops",
      "100.000 IU",
      "200.000 IU",
    ],
    required: true,
  },
  route: {
    type: String,
    enum: ["Oral", "Intramuscular", "Subcutaneous", "Intradermal"],
    required: true,
  },
  site: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Immunization", ImmunizationSchema);
