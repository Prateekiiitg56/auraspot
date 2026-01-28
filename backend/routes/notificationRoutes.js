const express = require("express");
const Notification = require("../models/Notification");
const User = require("../models/User");

const router = express.Router();


// CREATE REQUEST
router.post("/", async (req, res) => {
  try {
    const fromUser = await User.findOne({ email: req.body.fromEmail });
    const toUser = await User.findById(req.body.ownerId);

    if (!fromUser || !toUser) {
      return res.status(400).json({ message: "User missing" });
    }

    const notif = await Notification.create({
      from: fromUser._id,
      to: toUser._id,
      property: req.body.propertyId,
      message: req.body.message
    });

    res.json(notif);
  } catch (e) {
    res.status(500).json(e);
  }
});


// GET MY NOTIFICATIONS
router.get("/:email", async (req, res) => {
  const user = await User.findOne({ email: req.params.email });

  const notifications = await Notification.find({
    $or: [{ from: user._id }, { to: user._id }]
  })
    .populate("from", "name email")
    .populate("to", "name email")
    .populate("property", "title price");

  res.json(notifications);
});

router.get("/owner/:ownerId", async (req, res) => {
  const notes = await Notification.find({
    ownerId: req.params.ownerId
  }).sort({ createdAt: -1 });

  res.json(notes);
});


module.exports = router;
