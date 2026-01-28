const express = require("express");
const Property = require("../models/Property");
const User = require("../models/User");
const Notification = require("../models/Notification");
const multer = require("multer");

const router = express.Router();

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ================= CREATE PROPERTY ================= */

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const owner = await User.findOne({ email: req.body.ownerEmail });
    if (!owner) return res.status(400).json({ message: "Owner not found" });

    const amenities = String(req.body.amenities || "")
      .split(",")
      .map(a => a.trim())
      .filter(Boolean);

    const property = await Property.create({
      title: req.body.title,
      type: req.body.type,
      purpose: req.body.purpose,
      price: Number(req.body.price),
      city: req.body.city,
      area: req.body.area,
      latitude: Number(req.body.latitude),
      longitude: Number(req.body.longitude),
      amenities,
      description: req.body.description,
      image: req.file?.filename,
      owner: owner._id,
      status: "AVAILABLE"
    });

    res.json(property);
  } catch (err) {
    res.status(500).json({ message: "Failed to add property" });
  }
});

/* ================= EXPLORE (ONLY AVAILABLE) ================= */

router.get("/", async (req, res) => {
  const properties = await Property.find({ status: "AVAILABLE" })
    .sort({ createdAt: -1 })
    .populate("owner", "name email");

  res.json(properties);
});

router.get("/all", async (req, res) => {
  const properties = await Property.find()
    .populate("owner", "name email")
    .populate("assignedTo", "name email");

  res.json(properties);
});


/* ================= OWNER LISTINGS ================= */

router.get("/owner/:ownerId", async (req, res) => {
  const properties = await Property.find({
    owner: req.params.ownerId
  }).sort({ createdAt: -1 });

  res.json(properties);
});

/* ================= PROPERTY DETAILS ================= */

router.get("/:id", async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate("owner", "name email")
    .populate("assignedTo", "name email");

  res.json(property);
});

/* ================= DELETE ================= */

router.delete("/:id", async (req, res) => {
  await Property.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

/* ================= SEND REQUEST ================= */

router.post("/:id/request", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const property = await Property.findById(req.params.id)
      .populate("owner");

    if (!property || property.status !== "AVAILABLE") {
      return res.status(400).json({ message: "Property not available" });
    }

    property.status = "REQUESTED";
    property.assignedTo = user._id;
    await property.save();

    // Create notification for owner
    await Notification.create({
      from: user._id,
      to: property.owner._id,
      property: property._id,
      action: property.purpose === "RENT" ? "RENT" : "BUY",
      message: `${user.name || user.email} is interested in your ${property.type} for ${property.purpose}`
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to send request" });
  }
});

/* ================= OWNER ACCEPTS ================= */

router.post("/:id/approve", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property || property.status !== "REQUESTED") {
      return res.status(400).json({ message: "Invalid state" });
    }

    // Update property status to SOLD or BOOKED
    property.status = property.purpose === "SALE" ? "SOLD" : "BOOKED";
    await property.save();

    // Delete the notification after accepting
    if (req.body.notificationId) {
      try {
        await Notification.findByIdAndDelete(req.body.notificationId);
      } catch (notifErr) {
        console.log("Notification delete error (might already be deleted)");
      }
    }

    res.json({ ok: true, property });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: "Failed to approve request" });
  }
});

module.exports = router;
