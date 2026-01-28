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
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
