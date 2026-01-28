const express = require("express");
const Property = require("../models/Property");
const User = require("../models/User");
const Notification = require("../models/Notification");
const multer = require("multer");

console.log("🔥🔥🔥 PROPERTY ROUTES LOADED - NEW VERSION 🔥🔥🔥");

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
  try {
    const properties = await Property.find({ status: "AVAILABLE" })
      .sort({ createdAt: -1 })
      .populate("owner", "name email");

    res.json(properties);
  } catch (err) {
    console.error("EXPLORE ERROR:", err);
    res.status(500).json({ message: "Failed to load properties" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("owner", "name email")
      .populate("assignedTo", "name email");

    res.json(properties);
  } catch (err) {
    console.error("GET ALL ERROR:", err);
    res.status(500).json({ message: "Failed to load all properties" });
  }
});


/* ================= OWNER LISTINGS ================= */

router.get("/owner/:ownerId", async (req, res) => {
  try {
    const properties = await Property.find({
      owner: req.params.ownerId
    }).sort({ createdAt: -1 });

    res.json(properties);
  } catch (err) {
    console.error("OWNER LISTINGS ERROR:", err);
    res.status(500).json({ message: "Failed to load owner properties" });
  }
});

/* ================= PROPERTY DETAILS ================= */

router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("owner", "name email")
      .populate("assignedTo", "name email");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json(property);
  } catch (err) {
    console.error("PROPERTY DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to load property details" });
  }
});

/* ================= DELETE ================= */

router.delete("/:id", async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete property" });
  }
});

/* ================= RESET PROPERTY TO AVAILABLE (DEBUG) ================= */

router.post("/:id/reset", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    
    property.status = "AVAILABLE";
    property.assignedTo = null;
    await property.save();
    
    // Delete any notifications for this property
    await Notification.deleteMany({ property: req.params.id });
    
    res.json({ ok: true, property });
  } catch (err) {
    console.error("RESET ERROR:", err);
    res.status(500).json({ message: "Failed to reset property" });
  }
});

/* ================= SEND REQUEST ================= */

router.post("/:id/request", async (req, res) => {
  try {
    console.log("=== REQUEST RECEIVED ===");
    console.log("Email from request:", req.body.email);
    console.log("Message:", req.body.message);
    
    const user = await User.findOne({ email: req.body.email });
    console.log("User found:", user);
    
    if (!user) {
      console.log("USER NOT FOUND - returning 400");
      return res.status(400).json({ message: "⚠️ USER_NOT_FOUND_IN_DATABASE ⚠️" });
    }

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
      message: req.body.message || `${user.name || user.email} is interested in your ${property.type} for ${property.purpose}`
    });

    console.log("=== REQUEST SUCCESS ===");
    res.json({ ok: true });
  } catch (err) {
    console.error("SEND REQUEST ERROR:", err);
    res.status(500).json({ message: "Failed to send request" });
  }
});

/* ================= OWNER ACCEPTS ================= */

router.post("/:id/approve", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("owner")
      .populate("assignedTo");

    if (!property || property.status !== "REQUESTED") {
      return res.status(400).json({ message: "Invalid state" });
    }

    // Update property status to SOLD or BOOKED
    property.status = property.purpose === "SALE" ? "SOLD" : "BOOKED";
    await property.save();

    // Create notification to user that their request was accepted
    if (property.assignedTo && property.owner) {
      try {
        await Notification.create({
          from: property.owner._id,
          to: property.assignedTo._id,
          property: property._id,
          action: "ACCEPTED",
          message: `Your request for ${property.title} has been accepted!`
        });
        console.log(`Acceptance notification sent to user ${property.assignedTo.email}`);
      } catch (notifErr) {
        console.log("Failed to create acceptance notification:", notifErr);
      }
    }

    // Delete ALL request notifications for this property
    try {
      const deleteResult = await Notification.deleteMany({ 
        property: req.params.id,
        action: { $ne: "ACCEPTED" }
      });
      console.log(`Deleted ${deleteResult.deletedCount} request notifications for property ${req.params.id}`);
    } catch (notifErr) {
      console.log("Notification delete error:", notifErr);
    }

    res.json({ ok: true, property });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: "Failed to approve request" });
  }
});

module.exports = router;
