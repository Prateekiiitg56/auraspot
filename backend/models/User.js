const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,

  email: { 
    type: String, 
    unique: true, 
    required: true 
  },

  firebaseUid: { 
    type: String, 
    unique: true, 
    required: true 
  },

  phone: {
    type: String,
    default: ""
  },

  location: {
    type: String,
    default: ""
  },

  bio: {
    type: String,
    default: ""
  },

  role: { 
    type: String, 
    enum: ["USER", "OWNER"], 
    default: "USER" 
  },

  persona: { 
    type: String, 
    enum: ["STUDENT", "WORKER", "FAMILY"] 
  },

  verified: { 
    type: Boolean, 
    default: false 
  },

  verificationDocuments: [{
    type: {
      type: String,
      enum: ["AADHAR", "PAN", "DRIVING_LICENSE", "PASSPORT"]
    },
    documentNumber: String,
    uploadedAt: Date
  }],

  socials: {
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" }
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
