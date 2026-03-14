const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/db");

const app = express();

// connect database
connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SmartSplit API Running");
});

app.use("/api/auth", authRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});