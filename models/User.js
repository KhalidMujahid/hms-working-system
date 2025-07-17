const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, default: "1" },
  role: {
    type: String,
    enum: ["admin", "doctor", "nurse", "pharmacy", "lab", "frontdesk", "hmo"],
    required: true,
  },
});

userSchema.methods.verifyPassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
