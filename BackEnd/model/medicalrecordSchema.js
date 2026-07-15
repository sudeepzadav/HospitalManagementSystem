const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },

    symptoms: [
      {
        type: String,
        trim: true,
      },
    ],

    vitalSigns: {
      temperature: {
        type: Number,
      },

      bloodPressure: {
        type: String,
      },

      heartRate: {
        type: Number,
      },

      respiratoryRate: {
        type: Number,
      },

      oxygenLevel: {
        type: Number,
      },
    },

    prescription: [
      {
        medicineName: {
          type: String,
          required: true,
        },

        dosage: {
          type: String,
        },

        frequency: {
          type: String,
        },

        duration: {
          type: String,
        },

        instructions: {
          type: String,
        },
      },
    ],

    labReports: [
      {
        testName: {
          type: String,
        },

        result: {
          type: String,
        },

        reportFile: {
          type: String,
        },

        testDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    treatmentPlan: {
      type: String,
    },

    doctorNotes: {
      type: String,
    },

    followUpDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "completed", "follow_up"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.MedicalRecord ||
  mongoose.model("MedicalRecord", medicalRecordSchema);
