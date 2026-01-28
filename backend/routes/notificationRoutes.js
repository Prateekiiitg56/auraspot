const router = require("express").Router();
const Notification = require("../models/Notification");
const User = require("../models/User");


/* ================= CREATE REQUEST ================= */

router.post("/", async (req, res) => {
  try {
    const { from, ownerId, propertyId, action, message } = req.body;

    if (!from || !ownerId || !propertyId)
      return res.status(400).json({ message: "Missing data" });

    const fromUser = await User.findOne({ email: from });
    const toUser = await User.findById(ownerId);

    if (!fromUser || !toUser)
      return res.status(404).json({ message: "User not found" });

    const notif = await Notification.create({
      from: fromUser._id,
      to: toUser._id,
      property: propertyId,
      action,
      message: message || ""
    });

    res.status(201).json(notif);
  } catch (err) {
    console.error("NOTIFICATION CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to create notification" });
  }
});


/* ================= OWNER INBOX ================= */

router.get("/owner/:ownerId", async (req, res) => {
  try {
    const notes = await Notification.find({
      to: req.params.ownerId
    })
      .populate("from", "name email")
      .populate("property", "title price status")
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (err) {
    console.error("LOAD OWNER NOTES ERROR:", err);
    res.status(500).json({ message: "Failed loading notifications" });
  }
});


/* ================= SENDER HISTORY ================= */

router.get("/sender/:userId", async (req, res) => {
  try {
    const notes = await Notification.find({
      from: req.params.userId
    })
      .populate("to", "name email")
      .populate("property", "title price status")
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (err) {
    console.error("LOAD SENDER NOTES ERROR:", err);
    res.status(500).json({ message: "Failed loading notifications" });
  }
});

module.exports = router;
