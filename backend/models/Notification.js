const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },

  from: String, // email
  message: String,   // 🔥 user message
  action: {          // RENT or SALE
    type: String,
    enum: ["RENT", "SALE"]
  },

  seen: { type: Boolean, default: false }
}, { timestamps: true });

// Get notifications sent by a user (sender side)
router.get("/sender/:email", async (req, res) => {
  const notes = await Notification.find({
    from: req.params.email
  }).sort({ createdAt: -1 });

  res.json(notes);
});


module.exports = mongoose.model("Notification", notificationSchema);


