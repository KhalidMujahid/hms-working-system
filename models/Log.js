const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  log_time: { type: Date, default: Date.now },
  action: String,
  log_type: {
    type: String,
    enum: ["info", "warning", "error"],
    default: "info",
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Log", logSchema);
