const express = require("express");
const nurseRoutes = express.Router();
const { isNurse } = require("../middlewares/middlewares");

const PatientAssignment = require("../models/PatientAssignment");
const Immunization = require("../models/Immunization");
const Patient = require("../models/Patient");
const Vital = require("../models/Vital");
const NurseMedication = require("../models/NurseMedication");
const Appointment = require("../models/Appointment");
const Report = require("../models/Resport");

nurseRoutes.get("/dashboard", isNurse, async (req, res) => {
  try {
    const userId = req.session.userId;
    const nurseName = req.session.user.username;
    const today = new Date().toISOString().split("T")[0];

    // Count patients assigned today
    const assignedCount = await PatientAssignment.countDocuments({
      nurse_id: userId,
      date: today,
    });

    // Count vitals recorded today
    const vitalsCount = await Vital.countDocuments({
      nurse_id: userId,
      recorded_at: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Count pending medications
    const pendingMeds = await NurseMedication.countDocuments({
      nurse_id: userId,
      status: "pending",
    });

    // Count today's appointments
    const apptCount = await Appointment.countDocuments({ date: today });

    res.render("nurse/dashboard", {
      nurse_name: nurseName,
      today,
      assignedCount,
      vitalsCount,
      pendingMeds,
      apptCount,
    });
  } catch (err) {
    console.error("Nurse dashboard error:", err);
    res.status(500).send("Server error");
  }
});

// GET /nurse/patients
nurseRoutes.get("/patients", isNurse, async (req, res) => {
  try {
    const nurse_id = req.session.userId;
    const today = new Date().toISOString().split("T")[0];

    // Get assigned patient IDs
    const assignments = await PatientAssignment.find({ nurse_id }).select(
      "patient_id"
    );

    const patientIds = assignments.map((a) => a.patient_id);

    const patients = await Patient.find({ _id: { $in: patientIds } });

    res.render("nurse/patients", { patients, today });
  } catch (err) {
    console.error("Error loading nurse patients:", err);
    res.status(500).send("Server Error");
  }
});

// GET form page
nurseRoutes.get("/vitals", isNurse, async (req, res) => {
  try {
    const patients = await Patient.find().sort({ firstName: 1, lastName: 1 });
    const today = new Date().toISOString().split("T")[0];

    res.render("nurse/vitals", {
      patients,
      today,
    });
  } catch (error) {
    console.error("Vitals form error:", error);
    res.status(500).send("Server Error");
  }
});

// POST vitals form
nurseRoutes.post("/vitals", isNurse, async (req, res) => {
  try {
    const {
      patient_id,
      temperature,
      blood_pressure,
      pulse,
      respiratory_rate,
      notes,
      height,
      weight,
    } = req.body;

    const vital = new Vital({
      patient_id,
      nurse_id: req.session.userId,
      temperature,
      blood_pressure,
      pulse,
      height,
      weight,
      respiratory_rate,
      notes,
      recorded_at: new Date(),
    });

    await vital.save();

    res.redirect("/nurse/vitals/list");
  } catch (err) {
    console.error("Error saving vitals:", err);
    res.status(500).send("Failed to record vitals");
  }
});

nurseRoutes.get("/vitals/list", isNurse, async (req, res) => {
  const vitals = await Vital.find({ nurse_id: req.session.userId })
    .populate("patient_id", "firstName")
    .sort({ recorded_at: -1 });

  res.render("nurse/vitals_list", { vitals });
});

nurseRoutes.get("/vitals/edit/:id", isNurse, async (req, res) => {
  const vital = await Vital.findById(req.params.id).populate("patient_id");
  if (!vital) return res.status(404).send("Not found");

  res.render("nurse/vitals_edit", { vital });
});

// update vital
nurseRoutes.post("/vitals/update/:id", isNurse, async (req, res) => {
  await Vital.findByIdAndUpdate(req.params.id, {
    ...req.body,
  });
  res.redirect("/nurse/vitals/list");
});

// delete vital
nurseRoutes.post("/vitals/delete/:id", isNurse, async (req, res) => {
  await Vital.findByIdAndDelete(req.params.id);
  res.redirect("/nurse/vitals/list");
});

nurseRoutes.get("/vitals/patient/:id", isNurse, async (req, res) => {
  try {
    const patientId = req.params.id;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).send("Patient not found");

    const vitals = await Vital.find({ patient_id: patientId }).sort({
      recorded_at: -1,
    });

    res.render("nurse/view_patient_profile", {
      patient,
      vitals,
    });
  } catch (err) {
    console.error("View patient profile error:", err);
    res.status(500).send("Server error");
  }
});

nurseRoutes.get("/appointments", isNurse, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const appointments = await Appointment.find({ date: today })
      .populate("patient_id", "firstName")
      .populate("doctor_id", "username")
      .sort({ time: 1 });

    const formattedAppointments = appointments.map((a) => ({
      patient_name: a.patient_id.firstName,
      doctor_name: a.doctor_id.username,
      time: a.time,
      formattedTime: new Date(`1970-01-01T${a.time}Z`).toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      ),
      status: a.status,
    }));

    res.render("nurse/appointments", {
      today,
      appointments: formattedAppointments,
    });
  } catch (err) {
    console.error("Appointments fetch error:", err);
    res.status(500).send("Server error");
  }
});

// GET: List all meds for today
nurseRoutes.get("/medications", isNurse, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const meds = await NurseMedication.find({ date: today })
      .populate("patient_id", "firstName")
      .sort({ time: 1 });

    const medications = meds.map((m) => ({
      id: m._id,
      patient_name: m.patient_id.firstName,
      medication_name: m.medication_name,
      dosage: m.dosage,
      time: m.time,
      formattedTime: new Date(`1970-01-01T${m.time}Z`).toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      ),
      status: m.status,
    }));

    res.render("nurse/medications", {
      medications,
      today,
    });
  } catch (err) {
    console.error("Medication load error:", err);
    res.status(500).send("Server error");
  }
});

// POST: Mark medication as given
nurseRoutes.post("/medications/give", isNurse, async (req, res) => {
  const { med_id } = req.body;
  try {
    await NurseMedication.findByIdAndUpdate(med_id, { status: "given" });
    res.redirect("/nurse/medications");
  } catch (err) {
    console.error("Update med status failed:", err);
    res.status(500).send("Error updating medication");
  }
});

// GET: Reports list
nurseRoutes.get("/reports", isNurse, async (req, res) => {
  const { search = "", type = "", date = "" } = req.query;
  const today = new Date().toISOString().split("T")[0];

  try {
    const query = {};

    if (search) {
      const patients = await Patient.find({
        fullname: { $regex: search, $options: "i" },
      }).select("_id");
      query.patient_id = { $in: patients.map((p) => p._id) };
    }

    if (type) {
      query.report_type = type;
    }

    if (date) {
      query.date = date;
    }

    const reports = await Report.find(query)
      .sort({ date: -1 })
      .populate("patient_id");

    const reportData = reports.map((r) => ({
      id: r._id,
      report_type: r.report_type,
      details: r.details,
      date: r.date,
      patient_name: r.patient_id?.firstName || "N/A",
    }));

    res.render("nurse/reports", {
      today,
      search,
      type,
      date,
      reports: reportData,
    });
  } catch (err) {
    console.error("Failed to fetch reports:", err);
    res.status(500).send("Internal Server Error");
  }
});

// @route   GET /immunizations
// @desc    Show all immunization schedules
nurseRoutes.get("/immunizations", isNurse, async (req, res) => {
  try {
    const immunizations = await Immunization.find().sort({ createdAt: -1 });
    res.render("nurse/immunizations/index", { immunizations });
  } catch (err) {
    console.error(err);
    res.status(500).render("500", { message: "Failed to load immunizations." });
  }
});

// @route   GET /nurse/immunizations/new
// @desc    Render new immunization form
nurseRoutes.get("/immunizations/new", isNurse, (req, res) => {
  res.render("nurse/immunizations/new");
});

// @route   POST /immunizations/new
// @desc    Handle immunization creation
nurseRoutes.post("/immunizations/new", isNurse, async (req, res) => {
  try {
    const { vaccineName, minimumTargetAge, dosage, route, site, notes } =
      req.body;

    const newEntry = new Immunization({
      vaccineName,
      minimumTargetAge,
      dosage,
      route,
      site,
      notes,
    });

    await newEntry.save();
    res.redirect("/nurse/immunizations");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to save immunization schedule.");
  }
});

module.exports = nurseRoutes;
