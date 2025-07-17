const express = require("express");
const hmoRoutes = express.Router();
const Patient = require("../models/Patient");
const Claim = require("../models/Claim");
const { isHmo } = require("../middlewares/middlewares");

hmoRoutes.get("/dashboard", isHmo, async (req, res) => {
  try {
    const insuredPatients = await Patient.countDocuments({ insured: true });

    const pendingClaims = await Claim.countDocuments({ status: "pending" });
    const approvedClaims = await Claim.countDocuments({ status: "approved" });

    const payoutAgg = await Claim.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalPayout = payoutAgg[0]?.total || 0;

    res.render("hmo/dashboard", {
      today: new Date().toISOString().slice(0, 10),
      insuredPatients,
      pendingClaims,
      approvedClaims,
      totalPayout,
    });
  } catch (error) {
    console.error("HMO Dashboard Error:", error);
    res.status(500).render("500", { message: "Error loading dashboard" });
  }
});

// GET all claims
hmoRoutes.get("/claims", isHmo, async (req, res) => {
  const claims = await Claim.find().populate("patient").sort({ createdAt: -1 });
  res.render("hmo/claims", { claims });
});

// GET new claim form
hmoRoutes.get("/claims/new", isHmo, async (req, res) => {
  const patients = await Patient.find({ "insurance.provider": { $ne: null } });
  res.render("hmo/new-claim", { patients });
});

// POST submit new claim
hmoRoutes.post("/claims", isHmo, async (req, res) => {
  const { patientId, serviceDescription, amount } = req.body;
  await Claim.create({ patient: patientId, serviceDescription, amount });
  res.redirect("/hmo/claims");
});

// POST approve claim
hmoRoutes.post("/claims/:id/approve", isHmo, async (req, res) => {
  await Claim.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.redirect("/hmo/claims");
});

// POST reject claim
hmoRoutes.post("/claims/:id/reject", isHmo, async (req, res) => {
  await Claim.findByIdAndUpdate(req.params.id, { status: "rejected" });
  res.redirect("/hmo/claims");
});

// Show list of insured patients
hmoRoutes.get("/patients", isHmo, async (req, res) => {
  try {
    const patients = await Patient.find({
      insured: true,
    });
    res.render("hmo/patients", { patients });
  } catch (err) {
    console.error("Failed to load patients:", err);
    res.status(500).render("500", { message: "Failed to load patients" });
  }
});

// GET form to register insured patient
hmoRoutes.get("/patients/new", isHmo, (req, res) => {
  res.render("hmo/patients/new");
});

// POST to register insured patient
hmoRoutes.post("/patients/new", isHmo, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      addressStreet,
      addressCity,
      addressState,
      addressZipCode,
      addressCountry,
      emergencyName,
      emergencyRelation,
      emergencyPhone,
      bloodType,
      insuranceProvider,
      policyNumber,
      groupNumber,
    } = req.body;

    const patient = new Patient({
      doctor_id: req.session.userId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address: {
        street: addressStreet,
        city: addressCity,
        state: addressState,
        zipCode: addressZipCode,
        country: addressCountry || "NG",
      },
      emergencyContact: {
        name: emergencyName,
        relation: emergencyRelation,
        phone: emergencyPhone,
      },
      bloodType,
      insurance: {
        provider: insuranceProvider,
        policyNumber,
        groupNumber,
      },
      insured: insuranceProvider ? true : false,
    });

    await patient.save();

    res.redirect("/hmo/patients");
  } catch (error) {
    console.error("Error creating insured patient:", error);
    res.status(500).render("500", { message: "Error creating patient record" });
  }
});

hmoRoutes.get("/patients/:id", isHmo, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient || !patient.insured) {
      return res
        .status(404)
        .render("404", { message: "Patient not found or not insured" });
    }

    res.render("hmo/patients/show", { patient });
  } catch (err) {
    console.error("View Patient Error:", err);
    res.status(500).render("500", { message: "Error retrieving patient" });
  }
});

hmoRoutes.get("/patients/:id/edit", isHmo, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient || !patient.insured) {
      return res
        .status(404)
        .render("404", { message: "Patient not found or not insured" });
    }

    res.render("hmo/patients/edit", { patient });
  } catch (err) {
    console.error("Edit Patient Form Error:", err);
    res.status(500).render("500", { message: "Error loading edit form" });
  }
});

hmoRoutes.put("/patients/:id", isHmo, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      return res.status(404).render("404", { message: "Patient not found" });
    }

    res.redirect(`/hmo/patients`);
  } catch (err) {
    console.error("Update Patient Error:", err);
    res.status(500).render("500", { message: "Error updating patient" });
  }
});

hmoRoutes.delete("/patients/:id", isHmo, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).render("404", { message: "Patient not found" });
    }

    res.redirect("/hmo/patients");
  } catch (err) {
    console.error("Delete Patient Error:", err);
    res.status(500).render("500", { message: "Error deleting patient" });
  }
});

module.exports = hmoRoutes;
