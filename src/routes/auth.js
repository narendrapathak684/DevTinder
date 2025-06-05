const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user with hashed password
    const user = new User({
      ...req.body,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Error creating user" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { emailid, password } = req.body;

    // Check if email is provided
    if (!emailid) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    // Find user by email
    const user = await User.findOne({ emailid });
    if (!user) {
      return res.status(404).json({ error: "Invalid Credential" });
    }

    // Validate password using the user's method
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid Credential" });
    }

    // Generate token using the user's method
    const token = user.getJWT();

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    // If everything is valid
    res.json({
      message: "Login successful",
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        emailid: user.emailid,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error during login" });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});
module.exports = router;
