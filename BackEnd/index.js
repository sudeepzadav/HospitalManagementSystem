require("dotenv").config();
const express = require("express");
const connectDb = require("./config/connectDb");
const userRoutes = require("./router/userRouter");
const doctorRouter = require("./router/doctorRouter");
const patientRouter = require("./router/patientRouter");
const appointmentRouter = require("./router/appointmentRouter");
const medicalrecordRouter = require("./router/medicalrecordRouter");

const app = express();
app.use(express.json());


const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Server connected Succesfully" });
});


app.use("/api/users", require("./router/userRouter"));

app.use("/api/doctors", require("./router/doctorRouter"));

app.use("/api/patients", require("./router/patientRouter"));

app.use("/api/appointments", require("./router/appointmentRouter"));

app.use("/api/medical-records", require("./router/medicalrecordRouter"));



app.listen(PORT, () => {
    console.log(`Server Started ${PORT}`);
    connectDb();
});