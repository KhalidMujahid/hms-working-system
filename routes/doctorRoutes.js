const express = require("express");
const doctorRoutes = express.Router();

const Appointment = require("../models/Appointment");
const TheatreCase = require("../models/TheatreCase");
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const EHR = require("../models/EHR");
const LabResult = require("../models/LabResult");

const { ensureDoctor } = require("../middlewares/middlewares");
const Observation = require("../models/Observation");

doctorRoutes.get("/dashboard", ensureDoctor, async (req, res) => {
  try {
    const doctorId = req.session.userId;
    const doctorName = req.session.user.username;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      appointmentPatientIds,
      assignedPatientsCount,
      appointmentsToday,
      totalPrescriptions,
      pendingLabs,
    ] = await Promise.all([
      Appointment.distinct("patient", { doctor: doctorId }),

      // Assigned Patients
      Patient.countDocuments({
        _id: {
          $in: await Appointment.distinct("patient", {
            doctor: doctorId,
          }),
        },
      }),

      // Appointments Today
      Appointment.countDocuments({
        doctor_id: doctorId,
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
      }),

      // Prescriptions Total
      Prescription.countDocuments({ doctor_id: doctorId }),

      // Lab requests pending
      LabResult.countDocuments({
        requested_by: doctorId,
        status: { $ne: "completed" },
      }),
    ]);

    // Fetch recent activity
    const [upcomingAppointments, recentPrescriptions, recentLabs] =
      await Promise.all([
        Appointment.find({
          doctor_id: doctorId,
          appointment_date: { $gte: todayStart },
        })
          .sort({ appointment_date: 1 })
          .limit(5)
          .populate("patient_id", "full_name")
          .lean(),

        Prescription.find({ doctor_id: doctorId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("patient_id")
          .lean(),

        LabResult.find({ requested_by: doctorId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("patient_id", "full_name")
          .lean(),
      ]);

    res.render("doctor/dashboard", {
      doctorName,
      assignedPatients: assignedPatientsCount,
      appointmentsToday,
      totalPrescriptions,
      pendingLabs,
      upcomingAppointments: upcomingAppointments.map((a) => ({
        patient_name: a.patient_id?.full_name || "N/A",
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time || "N/A",
        status: a.status || "pending",
      })),
      recentPrescriptions: recentPrescriptions.map((p) => ({
        patient_name:
          `${p.patient_id.firstName} ${p.patient_id.lastName}` || "N/A",
        medicine_name: p.medications[0]?.name[0] || "N/A",
        date: p.createdAt,
      })),
      recentLabs: recentLabs.map((l) => ({
        patient_name: l.patient_id?.full_name || "N/A",
        test_name: l.test_type || "N/A",
        status: l.status || "pending",
      })),
    });
  } catch (error) {
    console.error("Error loading doctor dashboard:", error);
    res.status(500).send({ message: "Server Error" });
  }
});

// GET /doctor/patients
doctorRoutes.get("/patients", ensureDoctor, async (req, res) => {
  try {
    const doctorId = req.session.userId;

    const patients = await Patient.find({
      doctor_id: doctorId,
    }).select("firstName lastName dateOfBirth gender phone");

    console.log(patients);

    res.render("doctor/patients", { patients });
  } catch (error) {
    console.error("Error loading patients:", error);
    res.status(500).send("Server Error");
  }
});

doctorRoutes.get("/view-patient/:id", ensureDoctor, async (req, res) => {
  const doctorId = req.session.userId;
  const patientId = req.params.id;

  try {
    const patient = await Appointment.findById(patientId);
    if (!patient) return res.status(404).send("Patient not found");

    const patientRealID = await patient.populate("patient");

    const records = await EHR.find({ patient_id: patientRealID._id })
      .populate("doctor_id", "username")
      .sort({ date: -1 })
      .lean();

    const prescriptions = await Prescription.find({
      patient_id: patientRealID._id,
    })
      .sort({ date: -1 })
      .lean();

    const labs = await LabResult.find({ patient_id: patientRealID._id })
      .sort({ date: -1 })
      .lean();

    const formattedRecords = records.map((r) => ({
      ...r,
      doctor: r.doctor_id?.username || "Unknown",
    }));

    res.render("doctor/view-patient", {
      patient: {
        ...patient.toObject(),
        full_name: `${patient.firstName} ${patient.lastName}`,
        dob: patient.dateOfBirth?.toISOString().substring(0, 10),
      },
      records: formattedRecords,
      prescriptions,
      labs,
    });
  } catch (err) {
    console.error("View patient error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// GET /doctor/appointments
doctorRoutes.get("/appointments", ensureDoctor, async (req, res) => {
  try {
    const doctorId = req.session.user._id;

    const appointments = await Appointment.find({ doctor: doctorId })
      .sort({ appointmentDate: 1 })
      .populate("patient", "firstName lastName");

    const formattedAppointments = appointments.map((app) => {
      const timeStr = app.time;
      const today = new Date();
      const [hours, minutes] = timeStr.split(":");

      const fullDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parseInt(hours),
        parseInt(minutes)
      );

      const formatted = fullDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return {
        id: app._id,
        full_name: `${app.patient.firstName} ${app.patient.lastName}`,
        appointment_date: app.appointmentDate.toISOString().split("T")[0],
        time: formatted,
        status: app.status,
      };
    });

    res.render("doctor/appointments", {
      doctorName: req.session.user.username,
      appointments: formattedAppointments,
    });
  } catch (err) {
    console.error("Failed to load appointments:", err);
    res.status(500).send("Internal Server Error");
  }
});

// View a specific appointment
doctorRoutes.get("/view-appointments/:id", ensureDoctor, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      "patient"
    );
    if (!appointment) {
      return res
        .status(404)
        .render("404", { message: "Appointment not found." });
    }

    res.render("doctor/view-appointments", { appointment });
  } catch (err) {
    console.error("Error fetching appointment:", err);
    res.status(500).render("500", { message: "Unable to fetch appointment." });
  }
});

// POST /doctor/update-appointment-status/:id
doctorRoutes.post("/update-appointment-status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    await Appointment.findByIdAndUpdate(req.params.id, { status });
    res.redirect(`/doctor/view-appointments/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// GET /doctor/ehr
doctorRoutes.get("/ehr", ensureDoctor, async (req, res) => {
  try {
    const doctorId = req.session.user._id;

    const ehrRecords = await EHR.find({ doctor_id: doctorId })
      .sort({ date: -1 })
      .populate("patient_id", "firstName lastName");

    const records = ehrRecords.map((record) => ({
      id: record._id,
      full_name: `${record.patient_id.firstName} ${record.patient_id.lastName}`,
      date: record.date.toISOString().split("T")[0],
      diagnosis: record.diagnosis,
      treatment: record.treatment,
    }));

    res.render("doctor/ehr", {
      records,
      doctorName: req.session.user.username,
    });
  } catch (err) {
    console.error("Error loading EHR:", err);
    res.status(500).send("Server error");
  }
});

// GET /doctor/prescriptions
doctorRoutes.get("/prescriptions", ensureDoctor, async (req, res) => {
  try {
    const doctorId = req.session.user._id;

    const prescriptions = await Prescription.find({ doctor_id: doctorId })
      .sort({ date: -1 })
      .populate("patient_id", "firstName lastName");
    const patients = await Patient.find({ doctor_id: doctorId });

    const data = prescriptions.map((p) => ({
      id: p.patient_id._id,
      full_name: `${p.patient_id.firstName} ${p.patient_id.lastName}`,
      date: p.issued_at.toISOString().split("T")[0],
      medications: p.medications.map((med) => ({
        drug_name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
      })),
    }));

    res.render("doctor/prescriptions", {
      prescriptions: data,
      doctorName: req.session.user.username,
      patients,
    });
  } catch (err) {
    console.error("Error loading prescriptions:", err);
    res.status(500).send("Server error");
  }
});

// GET /doctor/prescriptions/create
// doctorRoutes.get("/prescriptions/create", async (req, res) => {
//   try {
//     const patients = await Patient.find();

//     res.render("doctor/create-prescription", { patients });
//   } catch (error) {
//     console.error("Error loading prescriptions:", error);
//     res.status(500).send("Server Error");
//   }
// });

// create pres
doctorRoutes.post("/prescriptions/create", ensureDoctor, async (req, res) => {
  const { patient_id, medications, notes } = req.body;
  const doctor_id = req.session.userId;

  try {
    await Prescription.create({
      patient_id,
      doctor_id,
      medications,
      notes,
    });
    res.redirect("/doctor/prescriptions");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create prescription.");
  }
});

doctorRoutes.get("/lab-requests", ensureDoctor, async (req, res) => {
  const doctorId = req.session.userId;

  const results = await LabResult.find({ doctor_id: doctorId })
    .populate("patient_id")
    .sort({ date_requested: -1 });
  const patients = await Appointment.find().populate("patient");

  const formattedResults = results.map((r) => ({
    id: r._id,
    patient_id: r.patient_id._id,
    full_name: `${r.patient_id.firstName} ${r.patient_id.lastName}`,
    test_type: r.test_type,
    date_requested: r.date_requested.toLocaleDateString(),
    status: r.status,
    result: r.result || "",
  }));

  res.render("doctor/lab-requests", { requests: formattedResults, patients });
});

// POST /doctor/lab-request/send
doctorRoutes.post("/doctor/lab-request/send", async (req, res) => {
  try {
    const { patient_id, test_type } = req.body;
    const patient = await Patient.findById(patient_id);
    if (!patient) return res.status(404).send("Patient not found");

    const newRequest = new LabRequest({
      patient_id,
      test_type,
      requested_at: new Date(),
    });

    await newRequest.save();
    res.redirect("/doctor/lab-requests");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to send lab request");
  }
});

// observation ROUTE

// get observation form
doctorRoutes.get("/observations/new", ensureDoctor, async (req, res) => {
  try {
    const patients = await Patient.find();
    res.render("doctor/observations/new", { patients });
  } catch (err) {
    console.error("Error loading form observation page:", err);
    res.status(500).render("500", { message: "Unable to get form." });
  }
});

// GET /doctor/observations/add
doctorRoutes.get("/observations/add", ensureDoctor, async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.render("doctor/observations/add", { patients });
  } catch (err) {
    console.error("Error loading patient selection page:", err);
    res.status(500).render("500", { message: "Unable to load patients." });
  }
});

// Create new observation
doctorRoutes.post("/observations/new/:id", ensureDoctor, async (req, res) => {
  console.log(req.body);
  try {
    const {
      date,
      time,
      temperature,
      pulse,
      respirationRate,
      systolic,
      diastolic,
      fluidsIntake,
      fluidsOutput,
      remark,
      drugsAndInfusion,
    } = req.body;

    const observation = new Observation({
      recordedBy: req.session.userId,
      patient: req.params.id,
      date,
      time: time,
      temperature,
      pulse,
      respirationRate,
      bloodPressure: {
        systolic,
        diastolic,
      },
      fluidsIntake,
      fluidsOutput,
      remark,
      drugsAndInfusion,
    });

    await observation.save();
    res.redirect("/doctor/observations");
  } catch (err) {
    console.error("Observation save error:", err);
    res.status(500).send("Server error");
  }
});

// DELETE route for an observation
doctorRoutes.delete("/observations/:id", ensureDoctor, async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id).populate(
      "patient"
    );

    if (!observation) {
      return res
        .status(404)
        .render("404", { message: "Observation not found." });
    }

    const patientId = observation.patient._id;

    await observation.deleteOne();

    res.redirect(`/doctor/observations/${patientId}`);
  } catch (err) {
    console.error("Error deleting observation:", err);
    res.status(500).render("500", { message: "Error deleting observation." });
  }
});

doctorRoutes.get("/observations/:patientId", ensureDoctor, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    const observations = await Observation.find({
      patient: req.params.patientId,
    }).sort({ createdAt: -1 });
    console.log(observations);
    res.render("doctor/observations", { patient, observations });
  } catch (err) {
    console.error("List Observation Error:", err);
    res.status(500).render("500", { message: "Failed to load observations" });
  }
});

doctorRoutes.get(
  "/observations/new/:patientId",
  ensureDoctor,
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).render("404", { message: "Patient not found" });
      }

      res.render("doctor/observations/new", { patient });
    } catch (err) {
      console.error("Error loading observation form:", err);
      res
        .status(500)
        .render("500", { message: "Unable to load observation form." });
    }
  }
);

// List of all patients that have at least one observation
doctorRoutes.get("/observations", ensureDoctor, async (req, res) => {
  try {
    const observations = await Observation.find().populate("patient");

    // Filter unique patients
    const uniquePatientsMap = new Map();
    observations.forEach((obs) => {
      if (obs.patient) {
        uniquePatientsMap.set(obs.patient._id.toString(), obs.patient);
      }
    });

    const patients = Array.from(uniquePatientsMap.values());

    res.render("doctor/observations/patient-list", { patients });
  } catch (err) {
    console.error("Error loading patient observation list:", err);
    res
      .status(500)
      .render("500", { message: "Unable to load observation patients." });
  }
});

// Theatre case

// GET /doctor/theatre - List all theatre cases
doctorRoutes.get("/theatre", ensureDoctor, async (req, res) => {
  try {
    const theatreCases = await TheatreCase.find().sort({ date: -1 });
    res.render("doctor/theatre/index", { theatreCases });
  } catch (err) {
    console.error("Error loading theatre cases:", err);
    res.status(500).render("500", { message: "Failed to load theatre cases." });
  }
});

// Show new theatre case form
doctorRoutes.get("/theatre/new", ensureDoctor, (req, res) => {
  res.render("doctor/theatre/new");
});

// Handle form submission
doctorRoutes.post("/theatre", ensureDoctor, async (req, res) => {
  try {
    const {
      caseName,
      hospitalNumber,
      date,
      diagnosis,
      surgeon,
      assistant,
      remarks,
    } = req.body;

    const newCase = new TheatreCase({
      caseName,
      hospitalNumber,
      date,
      diagnosis,
      surgeon,
      assistant,
      remarks,
    });

    await newCase.save();
    res.redirect("/doctor/theatre");
  } catch (err) {
    console.error("Error creating theatre case:", err);
    res
      .status(500)
      .render("500", { message: "Failed to create theatre case." });
  }
});

// View a specific theatre case
doctorRoutes.get("/theatre/view/:id", ensureDoctor, async (req, res) => {
  try {
    const theatreCase = await TheatreCase.findById(req.params.id);
    console.log(theatreCase);

    if (!theatreCase) {
      return res
        .status(404)
        .render("404", { message: "Theatre case not found" });
    }

    res.render("doctor/theatre/view", { theatreCase });
  } catch (err) {
    console.error("Error fetching theatre case:", err);
    res
      .status(500)
      .render("500", { message: "Server error retrieving theatre case." });
  }
});

// GET edit form
doctorRoutes.get("/theatre/edit/:id", ensureDoctor, async (req, res) => {
  try {
    const theatreCase = await TheatreCase.findById(req.params.id);
    if (!theatreCase) {
      return res
        .status(404)
        .render("404", { message: "Theatre case not found" });
    }
    res.render("doctor/theatre/edit", { theatreCase });
  } catch (err) {
    console.error("Error loading edit form:", err);
    res.status(500).render("500", { message: "Error loading edit form." });
  }
});

// POST update form
doctorRoutes.post("/theatre/:id/edit", ensureDoctor, async (req, res) => {
  try {
    const {
      caseName,
      hospitalNumber,
      date,
      diagnosis,
      surgeon,
      assistant,
      remarks,
    } = req.body;

    await TheatreCase.findByIdAndUpdate(req.params.id, {
      caseName,
      hospitalNumber,
      date,
      diagnosis,
      surgeon,
      assistant,
      remarks,
    });

    res.redirect(`/doctor/theatre/view/${req.params.id}`);
  } catch (err) {
    console.error("Error updating theatre case:", err);
    res
      .status(500)
      .render("500", { message: "Failed to update theatre case." });
  }
});

doctorRoutes.delete("/theatre/:id", ensureDoctor, async (req, res) => {
  try {
    await TheatreCase.findByIdAndDelete(req.params.id);
    res.redirect("/doctor/theatre");
  } catch (err) {
    console.error("Error deleting theatre case:", err);
    res
      .status(500)
      .render("500", { message: "Failed to delete theatre case." });
  }
});

module.exports = doctorRoutes;
