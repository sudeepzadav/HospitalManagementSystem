const Appointment = require("../model/appointmentSchema");

// Create Appointment
const createAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Appointments
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
        },
      })
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
        },
      });

    res.status(200).json({
      appointments,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Appointment By ID
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId")
      .populate("doctorId");

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Appointment Status
const updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      {
        new: true,
      },
    );

    res.json({
      message: "Appointment status updated",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Appointment
const deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);

    res.json({
      message: "Appointment deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
};
