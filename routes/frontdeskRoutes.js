const express = require("express");
const frontdeskRoutes = express.Router();
const Patient = require("../models/Patient");
const moment = require("moment");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { isFronDesk } = require("../middlewares/middlewares");
const Payment = require("../models/Payment");
const Bill = require("../models/Billing");

// GET /frontdesk/patients
frontdeskRoutes.get("/patients", isFronDesk, async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 }).lean();
    res.render("frontdesk/patients", { patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    req.flash("error", "Unable to fetch patients");
    res.redirect("/frontdesk/dashboard");
  }
});

// GET /frontdesk/register-patient
frontdeskRoutes.get("/patients/register", isFronDesk, async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" })
      .select("username _id")
      .lean();
    res.render("frontdesk/register-patient", { doctors });
  } catch (err) {
    console.error("Failed to load doctors:", err);
    req.flash("error", "Unable to load doctors");
    res.redirect("/frontdesk/dashboard");
  }
});

// view
frontdeskRoutes.get("/patients/:id", isFronDesk, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("doctor_id", "username")
      .lean();
    console.log(patient);
    if (!patient) {
      return res.status(404).render("404", { message: "Patient not found" });
    }

    res.render("frontdesk/view-patient", { patient });
  } catch (err) {
    console.error("Error fetching patient:", err);
    res.status(500).render("500", { message: "Server error" });
  }
});

// Edit Form Page
frontdeskRoutes.get("/patients/:id/edit", isFronDesk, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();
    const doctors = await User.find({ role: "doctor" })
      .select("username")
      .lean();

    if (!patient) return res.status(404).render("404");

    res.render("frontdesk/edit-patient", { patient, doctors });
  } catch (error) {
    console.error("Error loading edit form:", error);
    res.status(500).render("500");
  }
});

// Handle Edit Submission
frontdeskRoutes.post("/patients/:id/edit", isFronDesk, async (req, res) => {
  try {
    await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.flash("success", "Patient record updated successly");
    res.redirect(`/frontdesk/patients/${req.params.id}`);
  } catch (error) {
    console.error("Update error:", error);
    req.flash("error", "An error occured while updating patient record");
    res.status(400).render("500", { message: "Update failed" });
  }
});

// Delete Patient
frontdeskRoutes.get("/patients/:id/delete", isFronDesk, async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.redirect("/frontdesk/patients");
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).render("500");
  }
});

// CREATE a new patient
frontdeskRoutes.post("/patients/register", isFronDesk, async (req, res) => {
  try {
    const newPatient = await Patient.create(req.body);

    if (newPatient) {
      req.flash("success", "Patient registered successfully");
      return res.redirect("/frontdesk/patients");
    } else {
      req.flash("error", "Patient registration failed");
      return res.redirect("/frontdesk/patients/register");
    }
  } catch (error) {
    console.error("Error creating patient:", error);
    req.flash("error", "Something went wrong while registering patient");
    return res.redirect("/frontdesk/patients/register");
  }
});

frontdeskRoutes.get("/dashboard", isFronDesk, async (req, res) => {
  try {
    const user = req.session.user;
    const today = moment().format("YYYY-MM-DD");

    const patientCount = await Patient.countDocuments();
    const todayAppointments = await Appointment.countDocuments({ date: today });
    const pendingPayments = await Bill.countDocuments({ status: "Pending" });

    const payments = await Payment.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${today}T00:00:00.000Z`),
            $lte: new Date(`${today}T23:59:59.999Z`),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalPaymentsToday = payments[0]?.total || 0;

    res.render("frontdesk/dashboard", {
      user,
      today,
      patientCount,
      todayAppointments,
      pendingPayments,
      totalPaymentsToday,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET /frontdesk/appointments
frontdeskRoutes.get("/appointments", isFronDesk, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient")
      .populate("createdBy")
      .sort({ createdAt: -1 });

    const formatted = appointments.map((app) => ({
      _id: app._id,
      patientName:
        `${app.patient?.firstName} ${app.patient?.lastName}` || "N/A",
      date: app.createdAt,
      time: app.time || "NA",
      status: app.status,
      createdBy: app.createdBy.username || "Frontdesk",
    }));

    res.render("frontdesk/appointments", { appointments: formatted });
  } catch (err) {
    console.error("Error loading appointments:", err);
    res.status(500).send("Error loading appointments");
  }
});

// GET appointment form
frontdeskRoutes.get("/appointments/new", isFronDesk, async (req, res) => {
  try {
    const patients = await Patient.find().lean();
    const doctors = await User.find({ role: "doctor" }).lean();
    res.render("frontdesk/appointments/new", { patients, doctors });
  } catch (err) {
    console.error("Error loading appointment form:", err);
    res
      .status(500)
      .render("500", { message: "Failed to load appointment form" });
  }
});

// POST create new appointment
frontdeskRoutes.post("/appointments/new", isFronDesk, async (req, res) => {
  try {
    const { patient, doctor, time, appointmentDate, reason, notes } = req.body;

    const newAppointment = new Appointment({
      patient,
      doctor,
      appointmentDate,
      time,
      reason,
      notes,
      createdBy: req.session.userId,
    });

    await newAppointment.save();
    res.redirect("/frontdesk/appointments");
  } catch (err) {
    console.error("Error creating appointment:", err);
    res.status(400).render("500", { message: "Failed to create appointment" });
  }
});

// Show appointment details
frontdeskRoutes.get("/appointments/:id", isFronDesk, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient")
      .populate("doctor");

    if (!appointment) {
      return res
        .status(404)
        .render("404", { message: "Appointment not found" });
    }

    res.render("frontdesk/appointments/show", { appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).render("500", { message: "Error fetching appointment" });
  }
});

// Edit form
frontdeskRoutes.get("/appointments/:id/edit", isFronDesk, async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment)
    return res.status(404).render("404", { message: "Appointment not found" });
  res.render("frontdesk/appointments/edit", { appointment });
});

// Update
frontdeskRoutes.put("/appointments/:id", isFronDesk, async (req, res) => {
  const { date, time, reason, status } = req.body;
  await Appointment.findByIdAndUpdate(req.params.id, {
    date,
    time,
    reason,
    status,
  });
  res.redirect(`/frontdesk/appointments/${req.params.id}`);
});

// Delete
frontdeskRoutes.delete("/appointments/:id", isFronDesk, async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);
  res.redirect("/frontdesk/appointments");
});

// View all payments
frontdeskRoutes.get("/payments", isFronDesk, async (req, res) => {
  const payments = await Payment.find()
    .populate("patient", "firstName lastName")
    .populate("receivedBy", "username")
    .lean();

  res.render("frontdesk/payments", { payments });
});

// New payment form
frontdeskRoutes.get("/payments/new", isFronDesk, async (req, res) => {
  const patients = await Patient.find()
    .select("firstName lastName phone")
    .lean();
  res.render("frontdesk/new-payment", { patients });
});

// Handle new payment
frontdeskRoutes.post("/payments/new", isFronDesk, async (req, res) => {
  try {
    const { patient, amount, method, purpose } = req.body;
    const payment = new Payment({
      patient,
      amount,
      method,
      purpose,
      reference: "PAY-" + Date.now(),
      receivedBy: req.session.userId,
    });
    await payment.save();
    res.redirect("/frontdesk/payments");
  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).render("500", { message: "Failed to process payment" });
  }
});

// Edit form
frontdeskRoutes.get("/payments/:id/edit", isFronDesk, async (req, res) => {
  const payment = await Payment.findById(req.params.id).lean();
  if (!payment) return res.status(404).render("404");
  res.render("frontdesk/edit-payment", { payment });
});

// Handle edit POST
frontdeskRoutes.post("/payments/:id/edit", isFronDesk, async (req, res) => {
  const { amount, method, purpose } = req.body;
  try {
    await Payment.findByIdAndUpdate(req.params.id, { amount, method, purpose });
    res.redirect("/frontdesk/payments");
  } catch (err) {
    console.error("Edit Error:", err);
    res.status(500).render("500", { message: "Update failed" });
  }
});

// Delete payment
frontdeskRoutes.post("/payments/:id/delete", isFronDesk, async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.redirect("/frontdesk/payments");
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).render("500", { message: "Delete failed" });
  }
});

module.exports = frontdeskRoutes;
