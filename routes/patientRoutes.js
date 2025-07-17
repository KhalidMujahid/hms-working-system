const express = require("express");
const patientRoutes = express.Router();
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const LabResult = require("../models/LabResult");
const Vital = require("../models/Vital");

// GET /patients/patient/view/:id
patientRoutes.get("/patient/view/:id", async (req, res) => {
  try {
    const patientId = req.params.id;

    const patient = await Patient.findById(patientId).lean();
    if (!patient) {
      return res.status(404).send("Patient not found");
    }

    const prescriptions = await Prescription.find({
      patient: patientId,
    }).lean();
    const labResults = await LabResult.find({ patient_id: patientId }).lean();
    const vitals = await Vital.find({ patient_id: patientId }).lean();

    console.log(prescriptions, labResults, vitals, patient);

    res.render("patient/view-patient", {
      patient,
      prescriptions,
      labResults,
      vitals,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

module.exports = patientRoutes;
