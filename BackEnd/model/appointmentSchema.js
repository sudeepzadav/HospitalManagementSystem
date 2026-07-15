const mongoose = require("mongoose");


const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },

    diagnosis: {
      type: String,
      required: true
    },

    symptoms: [
      {
        type: String
      }
    ],

    prescription: [
      {
        medicine: {
          type: String
        },

        dosage: {
          type: String
        },

        duration: {
          type: String
        }
      }
    ],


    testReports: [
      {
        testName: String,
        result: String,
        reportFile: String
      }
    ],


    doctorNotes: {
      type: String
    },


    followUpDate: {
      type: Date
    }

  },
  {
    timestamps: true
  }
);


module.exports = mongoose.model(
  "MedicalRecord",
  medicalRecordSchema
);