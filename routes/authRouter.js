const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const authRouter = express.Router();

// Home Route
authRouter.get("/", (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(`/${req.session.role}/dashboard`);
  }
  return res.render("index");
});

// Login Page Route
authRouter.get("/auth/login", (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(`/${req.session.role}/dashboard`);
  }
  return res.render("auth/login", { error: null });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("auth/login", { error: "User not found." });
    }

    const isMatch = await user.verifyPassword(password);

    if (!isMatch) {
      return res.render("auth/login", { error: "Invalid password." });
    }

    // Save session
    req.session.userId = user._id;
    req.session.user = user;
    req.session.email = user.email;
    req.session.role = user.role;

    // Redirect by role
    return res.redirect(`/${user.role}/dashboard`);
  } catch (err) {
    console.error(err);
    return res.render("auth/login", { error: "Something went wrong." });
  }
});

// Register Routes
authRouter.get("/register", (req, res) => {
  return res.render("auth/register", { error: null, success: null });
});

authRouter.post("/register", async (req, res) => {
  const { username, email, role, password } = req.body;

  if (!username || !email || !role || !password) {
    return res.render("auth/register", {
      error: "All fields are required.",
      success: null,
    });
  }

  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.render("auth/register", {
        error: "Username already exists.",
        success: null,
      });
    }

    const existingMail = await User.findOne({ email });
    if (existingMail) {
      return res.render("auth/register", {
        error: "Email already exists.",
        success: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashedPassword, role });

    return res.render("auth/register", {
      error: null,
      success:
        "Registration successful. You can now <a href='/login' class='underline text-blue-600'>login</a>.",
    });
  } catch (err) {
    console.error(err);
    return res.render("auth/register", {
      error: "Something went wrong. Try again.",
      success: null,
    });
  }
});

// Logout Route
authRouter.get("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect(`${req.session.user.role}/dashboard`);
    }
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    res.redirect("/auth/login");
  });
});

module.exports = authRouter;
