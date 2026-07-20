require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDb = require("./config/connectDb");

const app = express();

// ======================
// Middleware
// ======================

app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true,
  })
);

app.use(express.json());


// ======================
// Port
// ======================

const PORT = process.env.PORT || 4000;


// ======================
// Test Route
// ======================

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Server connected Successfully",
  });
});


// ======================
// Routes
// ======================

app.use("/api/user", require("./router/userRouter"));

app.use("/api/doctors", require("./router/doctorRouter"));

app.use("/api/patients", require("./router/patientRouter"));

app.use(
  "/api/appointments",
  require("./router/appointmentRouter")
);

app.use(
  "/api/medical-records",
  require("./router/medicalrecordRouter")
);


// ======================
// Start Server
// ======================

app.listen(PORT, () => {
  console.log(`Server Started on port ${PORT}`);
  connectDb();
});