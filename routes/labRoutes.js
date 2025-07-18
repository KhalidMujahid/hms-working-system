const express = require("express");
const labRoutes = express.Router();
const LabRequest = require("../models/LabRequest");
const LabReport = require("../models/LabReport");
const LabResult = require("../models/LabResult");
const { isLab } = require("../middlewares/middlewares");

// GET: Lab Dashboard
labRoutes.get("/dashboard", isLab, async (req, res) => {
  try {
    const [pending, completed, critical, reports] = await Promise.all([
      LabRequest.countDocuments({ status: "Pending" }),
      LabRequest.countDocuments({ status: "Completed" }),
      LabRequest.countDocuments({ result: "Critical" }),
      LabReport.countDocuments(),
    ]);

    const today = new Date().toISOString().split("T")[0];

    res.render("lab/dashboard", {
      today,
      pending_requests: pending,
      completed_tests: completed,
      critical_alerts: critical,
      generated_reports: reports,
    });
  } catch (err) {
    console.error("Lab dashboard error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// GET /lab/reports
labRoutes.get("/reports", isLab, async (req, res) => {
  try {
    const { start, end, test } = req.query;

    // Filter object
    const filter = {};

    // If test type is selected
    if (test) {
      filter.test_type = test;
    }

    // Date range filtering
    if (start || end) {
      filter.created_at = {};
      if (start) filter.created_at.$gte = new Date(start);
      if (end) filter.created_at.$lte = new Date(end + "T23:59:59");
    }

    const reports = await LabReport.find(filter).sort({ created_at: -1 });

    const total_tests = await LabReport.countDocuments();
    const completed_tests = await LabReport.countDocuments({
      status: "Completed",
    });
    const pending_tests = await LabReport.countDocuments({ status: "Pending" });
    const abnormal_results = await LabReport.countDocuments({
      $or: [{ result: "Abnormal" }, { result: "Positive" }],
    });

    res.render("lab/reports", {
      today: new Date().toISOString().slice(0, 10),
      total_tests,
      completed_tests,
      pending_tests,
      abnormal_results,
      reports,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// GET /lab/requests
labRoutes.get("/requests", isLab, async (req, res) => {
  try {
    const requests = await LabRequest.find()
      .populate("patient_id")
      .sort({ requested_at: -1 });

    res.render("lab/requests", {
      requests,
      today: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// POST /lab/requests/mark-completed
labRoutes.post("/requests/mark-completed", isLab, async (req, res) => {
  const { request_id } = req.body;

  try {
    await LabRequest.findByIdAndUpdate(request_id, { status: "Completed" });
    res.redirect("/lab/requests");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to mark request as completed.");
  }
});

// GET /lab/results
labRoutes.get("/results", isLab, async (req, res) => {
  try {
    const results = await LabResult.find().sort({ test_date: -1 });

    res.render("lab/results", {
      results,
      today: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading results");
  }
});

// GET /lab/results/view/:id
labRoutes.get("/results/view/:id", isLab, async (req, res) => {
  const result = await LabResult.findById(req.params.id);
  res.render("lab/view_result", { result });
});

// GET /lab/results/update/:id
labRoutes.get("/results/update/:id", isLab, async (req, res) => {
  const result = await LabResult.findById(req.params.id);
  res.render("lab/update_result", { result });
});

module.exports = labRoutes;
