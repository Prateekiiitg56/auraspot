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
  },

  // Trust System Fields
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  totalRatings: {
    type: Number,
    default: 0
  },

  successfulDeals: {
    type: Number,
    default: 0
  },

  // Trust badge calculated based on verification + deals + rating
  // NEW_SELLER, VERIFIED_OWNER, TRUSTED_SELLER, TOP_SELLER
  trustBadge: {
    type: String,
    enum: ["NEW_SELLER", "VERIFIED_OWNER", "TRUSTED_SELLER", "TOP_SELLER"],
    default: "NEW_SELLER"
  },

  // Google login indicator
  isGoogleLogin: {
    type: Boolean,
    default: false
  },

  // Email verified indicator
  emailVerified: {
    type: Boolean,
    default: false
  },

  // Phone verified indicator
  phoneVerified: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
