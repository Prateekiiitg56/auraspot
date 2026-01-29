const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: String,

    type: {
      type: String,
      enum: ["ROOM", "PG", "HOSTEL", "FLAT", "HOME"],
      required: true
    },

    purpose: {
      type: String,
      enum: ["RENT", "SALE"],
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    city: String,
    area: String,

    image: String,

    latitude: Number,
    longitude: Number,

    amenities: [String],

    description: String,

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // 🔄 PROPERTY FLOW (real marketplace logic)
    status: {
      type: String,
      enum: ["AVAILABLE", "REQUESTED", "BOOKED", "SOLD"],
      default: "AVAILABLE"
    },

    // 👤 User who rented/bought
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Smart Property Score fields
    viewCount: {
      type: Number,
      default: 0
    },

    contactRequests: {
      type: Number,
      default: 0
    },

    // Cached property score (updated when viewed/requested)
    propertyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    // Score breakdown for display
    scoreBreakdown: {
      location: { type: Number, default: 0 },
      priceFairness: { type: Number, default: 0 },
      amenities: { type: Number, default: 0 },
      demand: { type: Number, default: 0 },
      ownerCredibility: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
