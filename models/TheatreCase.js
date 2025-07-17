const mongoose = require("mongoose");

const theatreCaseSchema = new mongoose.Schema({
  caseName: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  hospitalNumber: {
    type: String,
    required: true,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  surgeon: {
    type: String,
    required: true,
  },
  assistant: {
    type: String,
    required: false,
  },
  remarks: {
    type: String,
    trim: true,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TheatreCase", theatreCaseSchema);
