const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    action: String,
    message: String,
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
