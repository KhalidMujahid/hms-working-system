const mongoose = require("mongoose");

const observationSchema = new mongoose.Schema(
  {
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    time: String,
    temperature: Number,
    pulse: Number,
    respirationRate: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
    },
    fluidsIntake: String,
    fluidsOutput: String,
    remark: String,
    drugsAndInfusion: [
      {
        drugName: String,
        days: Number,
        date: Date,
        doses: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Observation", observationSchema);
