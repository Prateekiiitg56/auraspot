const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
{
  title: String,

  type: { 
    type: String, 
    enum: ["ROOM", "PG", "HOSTEL", "FLAT", "HOME"] 
  },

  purpose: { 
    type: String, 
    enum: ["RENT", "SALE"] 
  },

  price: Number,

  city: String,
  area: String,

  image: String,

  latitude: Number,
  longitude: Number,

  amenities: [String],

  description: String,

  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },

  // 🔄 PROPERTY FLOW STATE
  status: {
    type: String,
    enum: ["AVAILABLE", "REQUESTED", "RENTED"],
    default: "AVAILABLE"
  },

  rentedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
