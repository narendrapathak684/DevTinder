const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = "your-secret-key"; // In production, use environment variable

const auth = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Please login first" });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user by id from token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Session expired. Please login again" });
    }
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = auth;
