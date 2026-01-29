const express = require("express");
const Property = require("../models/Property");
const User = require("../models/User");
const Notification = require("../models/Notification");
const multer = require("multer");
const { calculatePropertyScore, getScoreDescription, calculateTrustBadge } = require("../utils/scoreCalculator");
const { calculateAIMatchScore, getAISuggestions } = require("../utils/aiMatchEngine");

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
      .populate("owner", "name email verified rating successfulDeals trustBadge isGoogleLogin emailVerified phoneVerified");

    // Calculate scores for all properties
    const propertiesWithScores = properties.map(prop => {
      const scoreResult = calculatePropertyScore(prop, prop.owner);
      const propObj = prop.toObject();
      propObj.propertyScore = scoreResult.totalScore;
      propObj.scoreBreakdown = scoreResult.breakdown;
      propObj.scoreDescription = getScoreDescription(scoreResult.totalScore, scoreResult.breakdown);
      return propObj;
    });

    res.json(propertiesWithScores);
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
      .populate("owner", "name email verified rating totalRatings successfulDeals trustBadge isGoogleLogin emailVerified phoneVerified")
      .populate("assignedTo", "name email");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Increment view count
    property.viewCount = (property.viewCount || 0) + 1;
    
    // Calculate property score
    const scoreResult = calculatePropertyScore(property, property.owner);
    property.propertyScore = scoreResult.totalScore;
    property.scoreBreakdown = scoreResult.breakdown;
    
    await property.save();
    
    // Add score description to response
    const propertyObj = property.toObject();
    propertyObj.scoreDescription = getScoreDescription(scoreResult.totalScore, scoreResult.breakdown);

    res.json(propertyObj);
  } catch (err) {
    console.error("PROPERTY DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to load property details" });
  }
});

/* ================= DELETE ================= */

router.delete("/:id", async (req, res) => {
  try {
    // Delete all notifications related to this property
    await Notification.deleteMany({ property: req.params.id });
    console.log(`Deleted notifications for property ${req.params.id}`);
    
    // Delete all chat messages related to this property
    const Chat = require("../models/Chat");
    await Chat.deleteMany({ property: req.params.id });
    console.log(`Deleted chats for property ${req.params.id}`);
    
    // Delete the property
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

    // Increment contact requests count
    property.contactRequests = (property.contactRequests || 0) + 1;
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

/* ================= AI RENTAL MATCH ENGINE ================= */

router.post("/ai-match", async (req, res) => {
  try {
    const { 
      preferredLocation,
      budgetMin,
      budgetMax,
      purpose,
      propertyType,
      userProfile,
      requiredAmenities
    } = req.body;

    // Fetch all available properties
    const properties = await Property.find({ status: "AVAILABLE" })
      .populate("owner", "name email verified rating successfulDeals trustBadge");

    // Calculate AI match scores for each property
    const preferences = {
      preferredLocation,
      budgetMin: Number(budgetMin) || 0,
      budgetMax: Number(budgetMax) || Infinity,
      purpose,
      propertyType,
      userProfile,
      requiredAmenities: requiredAmenities || []
    };

    const scoredProperties = properties.map(prop => {
      const propObj = prop.toObject();
      
      // Calculate regular property score
      const regularScore = calculatePropertyScore(prop, prop.owner);
      propObj.propertyScore = regularScore.totalScore;
      propObj.scoreBreakdown = regularScore.breakdown;
      
      // Calculate AI match score based on user preferences
      const aiScore = calculateAIMatchScore(prop, preferences);
      propObj.aiScore = aiScore;
      
      return propObj;
    });

    // Get categorized suggestions
    const suggestions = getAISuggestions(scoredProperties);

    res.json({
      success: true,
      totalProperties: scoredProperties.length,
      suggestions,
      allMatches: scoredProperties.sort((a, b) => b.aiScore.totalScore - a.aiScore.totalScore)
    });

  } catch (err) {
    console.error("AI MATCH ERROR:", err);
    res.status(500).json({ message: "Failed to process AI matching" });
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

    // Increment owner's successful deals and update trust badge
    if (property.owner) {
      const owner = await User.findById(property.owner._id);
      if (owner) {
        owner.successfulDeals = (owner.successfulDeals || 0) + 1;
        owner.trustBadge = calculateTrustBadge(owner);
        await owner.save();
        console.log(`Owner ${owner.email} now has ${owner.successfulDeals} successful deals`);
      }
    }

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
