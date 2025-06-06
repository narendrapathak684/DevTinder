const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = "your-secret-key"; // In production, use environment variable

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name cannot exceed 50 characters"],
      validate: {
        validator: function (value) {
          return validator.isAlpha(value.replace(/\s/g, ""));
        },
        message: "First name can only contain letters and spaces",
      },
    },
    lastname: {
      type: String,
      trim: true,
      minlength: [2, "Last name must be at least 2 characters long"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
      validate: {
        validator: function (value) {
          return validator.isAlpha(value.replace(/\s/g, ""));
        },
        message: "Last name can only contain letters and spaces",
      },
    },
    photoUrl: {
      type: String,
      default: "default-profile.jpg", // Default profile picture
      validate: {
        validator: function (value) {
          return validator.isURL(value, { protocols: ["http", "https"] });
        },
        message: "Please provide a valid URL for the photo",
      },
    },
    emailid: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Please enter a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      maxlength: [1024, "Password cannot exceed 1024 characters"],
      validate: {
        validator: function (value) {
          return validator.isStrongPassword(value, {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          });
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
      },
    },
    age: {
      type: Number,
      min: [7, "Age must be at least 7"],
      max: [100, "Age cannot exceed 100"],
      validate: {
        validator: function (value) {
          return validator.isInt(value.toString(), { min: 7, max: 100 });
        },
        message: "Age must be a valid number between 7 and 100",
      },
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "Gender must be either male, female, or other",
      },
      validate: {
        validator: function (value) {
          return validator.isIn(value, ["male", "female", "other"]);
        },
        message: "Gender must be either male, female, or other",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Method to generate JWT token
userSchema.methods.getJWT = function () {
  return jwt.sign({ userId: this._id }, JWT_SECRET, { expiresIn: "24h" });
};

// Method to validate password
userSchema.methods.validatePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error("Password validation failed");
  }
};

module.exports = mongoose.model("User", userSchema);
