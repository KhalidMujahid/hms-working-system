const express = require("express");
const adminRoutes = express.Router();

const User = require("../models/User");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Consultation = require("../models/Consultation");
const LabResult = require("../models/LabResult");
const Prescription = require("../models/Prescription");
const Billing = require("../models/Billing");
const Log = require("../models/Log");
const bcrypt = require("bcryptjs");
const { isAdmin } = require("../middlewares/middlewares");

adminRoutes.get("/dashboard", isAdmin, async (req, res) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

    const [totalUsers, totalPatients, todaysAppointments, totalLogs] =
      await Promise.all([
        User.countDocuments(),
        Patient.countDocuments(),
        Appointment.countDocuments({
          appointmentDate: { $gte: todayStart, $lt: todayEnd },
        }),
        Log.countDocuments(),
      ]);

    // Fetch recent 5 appointments
    const recentAppointments = await Appointment.find()
      .sort({ appointmentDate: -1 })
      .limit(5)
      .populate("patient", "name");

    // Fetch recent 5 logs
    const activityLogs = await Log.find()
      .sort({ log_time: -1 })
      .limit(5)
      .populate("user", "username");

    const chartLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const chartData = [4, 7, 5, 6, 8]; // Replace with actual data if needed

    res.render("admin/dashboard", {
      totalUsers,
      totalPatients,
      todaysAppointments,
      totalLogs,
      recentAppointments: recentAppointments.map((apt) => ({
        patientName: apt.patient?.name || "Unknown",
        date: apt.appointmentDate,
        status: apt.status || "Scheduled",
      })),
      activityLogs: activityLogs.map((log) => ({
        username: log.user?.username || "System",
        action: log.action,
        log_time: log.log_time,
      })),
      chartLabels,
      chartData,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

adminRoutes.get("/logs", isAdmin, async (req, res) => {
  try {
    const logs = await Log.find()
      .populate("user", "username")
      .sort({ log_time: -1 });

    res.render("admin/logs", { logs });
  } catch (err) {
    console.error(err);
    res.render("admin/logs", { logs: [] });
  }
});

adminRoutes.get("/manage-users", isAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ _id: 1 });
    res.render("admin/manage-users", { users });
  } catch (err) {
    console.error("Manage Users Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

adminRoutes.get("/edit-user/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");

    res.render("admin/edit-user", { user });
  } catch (err) {
    console.error("Edit user fetch error:", err);
    res.status(500).send("Server Error");
  }
});

adminRoutes.post("/edit-user/:id", isAdmin, async (req, res) => {
  const { username, email, role, status, password } = req.body;
  try {
    const updateData = {
      username,
      email,
      role,
      status: status === "1" ? 1 : 0,
    };

    if (password) {
      updateData.password = password;
    }

    await User.findByIdAndUpdate(req.params.id, updateData);

    res.redirect("/admin/manage-users");
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).send("Server Error");
  }
});

// GET Add User Page
adminRoutes.get("/add-user", isAdmin, (req, res) => {
  res.render("admin/add-user");
});

// POST Add User Handler
adminRoutes.post("/add-user", isAdmin, async (req, res) => {
  try {
    const { username, email, password, role, status } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).send("All fields are required.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      status: parseInt(status),
    });

    await Log.create({
      user_id: req.session.userId,
      action: `New user added`,
      log_type: "info",
    });

    await newUser.save();
    res.redirect("/admin/manage-users");
  } catch (error) {
    console.error("Add User Error:", error);
    res.status(500).send("Server Error");
  }
});

// DELETE USER
adminRoutes.get("/delete-user/:id", isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).send("User not found.");
    }

    await Log.create({
      user_id: req.session.userId,
      action: `Deleted user`,
      log_type: "info",
    });

    res.redirect("/admin/manage-users");
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

adminRoutes.get("/reports", isAdmin, async (req, res) => {
  try {
    const [
      patientsCount,
      consultationsCount,
      labsCount,
      prescriptionsCount,
      totalRevenue,
      recentBillings,
    ] = await Promise.all([
      Patient.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lte: new Date(),
        },
      }),
      Consultation.countDocuments(),
      LabResult.countDocuments({ status: "completed" }),
      Prescription.countDocuments(),
      Billing.aggregate([
        { $match: { status: "Paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Billing.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("patient_id", "full_name"),
    ]);

    res.render("admin/reports", {
      patients: patientsCount,
      consultations: consultationsCount,
      labs: labsCount,
      prescriptions: prescriptionsCount,
      revenue: totalRevenue[0]?.total || 0,
      recentBillings,
    });
  } catch (error) {
    console.error("Reports Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = adminRoutes;
