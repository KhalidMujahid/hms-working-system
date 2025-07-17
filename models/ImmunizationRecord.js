const mongoose = require("mongoose");

const ImmunizationRecordSchema = new mongoose.Schema(
  {
    parentName: {
      type: String,
      required: true,
    },
    parentPhone: {
      type: String,
      required: true,
    },
    childName: {
      type: String,
      required: true,
    },
    childDOB: {
      type: Date,
      required: true,
    },
    immunization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Immunization",
      required: true,
    },
    dateAdministered: {
      type: Date,
      required: true,
    },
    administeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImmunizationRecord", ImmunizationRecordSchema);
