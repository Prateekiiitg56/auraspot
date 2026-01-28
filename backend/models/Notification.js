const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    action: String,
    message: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
