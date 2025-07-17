const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: [
        "tablet",
        "capsule",
        "ml",
        "mg",
        "syrup",
        "tube",
        "patch",
        "bottle",
        "other",
      ],
      default: "tablet",
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: [
        "Antibiotic",
        "Analgesic",
        "Antimalarial",
        "Antipyretic",
        "Supplement",
        "Vaccine",
        "Other",
      ],
      default: "Other",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medication", medicationSchema);
