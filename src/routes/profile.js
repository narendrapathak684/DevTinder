const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { validateProfileEdit } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");

// Profile route using auth middleware
router.get("/view", auth, (req, res) => {
  res.json({
    message: "Profile retrieved successfully",
    user: {
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      emailid: req.user.emailid,
      age: req.user.age,
      gender: req.user.gender,
      photoUrl: req.user.photoUrl,
    },
  });
});

// Update profile route
router.patch("/edit", auth, async (req, res) => {
  try {
    // Validate the update data
    const validation = validateProfileEdit(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Get the current user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update only the fields that are provided in the request
    Object.keys(validation.validatedData).forEach((key) => {
      user[key] = validation.validatedData[key];
    });

    // Save the updated user
    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        emailid: user.emailid,
        age: user.age,
        gender: user.gender,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({ errors: validationErrors });
    }

    res.status(500).json({ error: "Error updating profile" });
  }
});

// Update password route
router.patch("/edit/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Both current password and new password are required",
      });
    }

    // Get the current user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Validate new password strength
    if (
      !validator.isStrongPassword(newPassword, {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        error:
          "New password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ error: "Error updating password" });
  }
});

module.exports = router;
