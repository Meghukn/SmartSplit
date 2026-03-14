const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
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
app.use("/api/expenses", expenseRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});