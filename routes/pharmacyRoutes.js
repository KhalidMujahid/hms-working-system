const express = require("express");
const pharmacyRoutes = express.Router();
const Medication = require("../models/Medication");
const Prescription = require("../models/Prescription");
const Dispensed = require("../models/DispensedMedication");
const { isPharmacist } = require("../middlewares/middlewares");

pharmacyRoutes.get("/dashboard", isPharmacist, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [medications, pendingPrescriptions, outOfStock, todaysDispensed] =
      await Promise.all([
        Medication.countDocuments(),
        Prescription.countDocuments({ status: "pending" }),
        Medication.countDocuments({ quantity: 0 }),
        Dispensed.countDocuments({ dispensed_at: { $gte: new Date(today) } }),
      ]);

    res.render("pharmacy/dashboard", {
      today,
      medications,
      pending_prescriptions: pendingPrescriptions,
      out_of_stock: outOfStock,
      todays_dispensed: todaysDispensed,
    });
  } catch (err) {
    console.error("Pharmacy Dashboard Error:", err);
    res.status(500).render("500", { message: "Server error" });
  }
});

// View inventory
pharmacyRoutes.get("/inventory", isPharmacist, async (req, res) => {
  try {
    const medications = await Medication.find().sort({ name: 1 }).lean();
    res.render("pharmacy/inventory", { medications });
  } catch (err) {
    console.error("Error loading inventory:", err);
    res
      .status(500)
      .render("500", { message: "Server error loading inventory" });
  }
});

// Add new medication form
pharmacyRoutes.get("/medications/new", isPharmacist, (req, res) => {
  res.render("pharmacy/add-medication");
});

// Save new medication
pharmacyRoutes.post("/medications/new", isPharmacist, async (req, res) => {
  try {
    const newMedication = new Medication(req.body);
    await newMedication.save();
    res.redirect("/pharmacy/inventory");
  } catch (err) {
    console.error("Error saving medication:", err);
    res.status(400).render("pharmacy/add-medication");
  }
});

// DELETE /pharmacy/medications/:id
pharmacyRoutes.delete("/medications/:id", isPharmacist, async (req, res) => {
  try {
    const { id } = req.params;
    await Medication.findByIdAndDelete(id);
    res.redirect("/pharmacy/inventory");
  } catch (err) {
    console.error("Error deleting medication:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = pharmacyRoutes;
