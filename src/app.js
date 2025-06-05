const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);

app.post("/user", async (req, res) => {
  try {
    const { emailid } = req.body;

    if (!emailid) {
      return res.status(400).json({ error: "Email ID is required" });
    }

    const user = await User.findOne({ emailid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ emailid: user.emailid });
  } catch (err) {
    res.status(500).json({ error: "Error fetching user" });
  }
});

connectDB()
  .then(() => {
    console.log("database connection established");
    app.listen(4545, () => {
      console.log("server is listening");
    });
  })
  .catch((err) => {
    console.log("database cannot be connected");
  });

// app.use("/naren", (req, res) => {
//   res.send("hello i am narendra pathak");
// });
