require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDb = require("./config/connectDb");
const path = require("path");
const app = express();

// ======================
// Middleware
// ======================

const allowedOrigins = [
  "http://localhost:5173",
  "https://hospitalmanagementsystem-cpss.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman, curl, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// ...rest stays the same


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

app.use("/api/payments", require("./router/paymentRouter"));

app.use("/api/appointments", require("./router/appointmentPdfRouter"));

app.use("/api/appointments", require("./router/appointmentRouter"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/chatbot", require("./router/chatboatRouter"));

app.use("/api/jobs", require("./router/jobRouter"));

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