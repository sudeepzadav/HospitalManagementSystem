const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
    },

    bloodGroup: {
      type: String,
      enum: [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-"
      ]
    },

    allergies: [
      {
        type: String
      }
    ],

    medicalHistory: [
      {
        type: String
      }
    ],

    emergencyContact: {
      name: {
        type: String
      },

      phone: {
        type: String
      },

      relation: {
        type: String
      }
    },

    insurance: {
      provider: {
        type: String
      },

      policyNumber: {
        type: String
      }
    },

    height: {
      type: Number
    },

    weight: {
      type: Number
    }

  },
  {
    timestamps: true
  }
);


module.exports = mongoose.model("Patient", patientSchema);