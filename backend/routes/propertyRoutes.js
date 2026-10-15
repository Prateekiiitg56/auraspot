const express = require("express");
const multer = require("multer");
const Property = require("../models/Property");
const User = require("../models/User");
const Notification = require("../models/Notification");
const RentAgreement = require("../models/RentAgreement");
const Chat = require("../models/Chat");
const Maintenance = require("../models/Maintenance");
const { calculatePropertyScore, getScoreDescription, calculateTrustBadge } = require("../utils/scoreCalculator");
const { calculateAIMatchScore, getAISuggestions } = require("../utils/aiMatchEngine");
const aiService = require("../services/aiService");
const { uploadMultipleImages, deleteImage } = require("../services/cloudinaryService");
const { requireAuth, sameId } = require("../middleware/auth");

const router = express.Router();

const PROPERTY_TYPES = ["ROOM", "PG", "HOSTEL", "FLAT", "HOME"];
const PURPOSES = ["RENT", "SALE"];
const FURNISHING = ["Furnished", "Semi-Furnished", "Unfurnished"];
const MAX_IMAGES = 5;
const OWNER_PUBLIC = "name email verified rating totalRatings successfulDeals trustBadge isGoogleLogin emailVerified phoneVerified";

// Memory storage: files are streamed to Cloudinary (serverless has a read-only filesystem)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: MAX_IMAGES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files are allowed"));
  }
});

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const positiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const coordinate = (value, limit) => {
  const n = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(n) && Math.abs(n) <= limit ? n : undefined;
};

// Accepts a JSON array or a comma-separated string
const parseAmenities = (raw) => {
  if (Array.isArray(raw)) return raw.map((a) => String(a).trim()).filter(Boolean).slice(0, 30);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((a) => String(a).trim()).filter(Boolean).slice(0, 30);
  } catch {
    // not JSON
  }
  return raw.split(",").map((a) => a.trim()).filter(Boolean).slice(0, 30);
};

const withScore = (prop) => {
  const scoreResult = calculatePropertyScore(prop, prop.owner);
  const obj = prop.toObject ? prop.toObject() : prop;
  obj.propertyScore = scoreResult.totalScore;
  obj.scoreBreakdown = scoreResult.breakdown;
  obj.scoreDescription = getScoreDescription(scoreResult.totalScore, scoreResult.breakdown);
  return obj;
};

const regenerateInsights = (property) => {
  aiService.clearPropertyCache(String(property._id));
  aiService
    .generatePropertyInsights(property)
    .then((insights) => insights && Property.findByIdAndUpdate(property._id, { aiInsights: insights }))
    .catch((err) => console.error("[AI] Background insights error:", err.message));
};

/* ================= CREATE PROPERTY ================= */

router.post("/", requireAuth, upload.array("images", MAX_IMAGES), async (req, res) => {
  try {
    const { type, purpose } = req.body;
    const title = text(req.body.title, 120);
    const city = text(req.body.city, 80);
    const price = positiveNumber(req.body.price);

    if (!title || !city || !price || !PROPERTY_TYPES.includes(type) || !PURPOSES.includes(purpose)) {
      return res.status(400).json({ message: "Title, type, purpose, city and a valid price are required" });
    }

    let imageUrls = [];
    if (req.files?.length) {
      try {
        imageUrls = await uploadMultipleImages(req.files, "auraspot/properties");
      } catch (uploadError) {
        console.error("[CLOUDINARY] Upload error:", uploadError);
        return res.status(502).json({ message: "Image upload failed. Please try again." });
      }
    }

    const property = await Property.create({
      title,
      type,
      purpose,
      price,
      city,
      area: text(req.body.area, 120),
      latitude: coordinate(req.body.latitude, 90),
      longitude: coordinate(req.body.longitude, 180),
      amenities: parseAmenities(req.body.amenities),
      description: text(req.body.description, 3000),
      images: imageUrls,
      image: imageUrls[0] || null,
      owner: req.user._id,
      status: "AVAILABLE",
      listingType: purpose === "SALE" ? "sale" : "rent",
      bhk: positiveNumber(req.body.bhk),
      sqft: positiveNumber(req.body.sqft),
      furnishing: FURNISHING.includes(req.body.furnishing) ? req.body.furnishing : "Unfurnished"
    });

    regenerateInsights(property);
    res.status(201).json(property);
  } catch (err) {
    console.error("CREATE PROPERTY ERROR:", err);
    res.status(500).json({ message: "Failed to add property" });
  }
});

/* ================= EXPLORE (ONLY AVAILABLE) ================= */

router.get("/", async (req, res) => {
  try {
    const properties = await Property.find({ status: "AVAILABLE" })
      .sort({ createdAt: -1 })
      .populate("owner", OWNER_PUBLIC);

    res.json(properties.map(withScore));
  } catch (err) {
    console.error("EXPLORE ERROR:", err);
    res.status(500).json({ message: "Failed to load properties" });
  }
});

/* ================= MY DEALS (properties rented/bought by the signed-in user) ================= */

router.get("/mine/deals", requireAuth, async (req, res) => {
  try {
    const deals = await Property.find({
      assignedTo: req.user._id,
      status: { $in: ["BOOKED", "SOLD"] }
    })
      .sort({ updatedAt: -1 })
      .populate("owner", "name email");

    res.json(deals);
  } catch (err) {
    console.error("MY DEALS ERROR:", err);
    res.status(500).json({ message: "Failed to load deals" });
  }
});

/* ================= OWNER LISTINGS ================= */

router.get("/owner/:ownerId", async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.params.ownerId })
      .sort({ createdAt: -1 })
      .populate("assignedTo", "name email");

    res.json(properties);
  } catch (err) {
    console.error("OWNER LISTINGS ERROR:", err);
    res.status(500).json({ message: "Failed to load owner properties" });
  }
});

/* ================= AI RENTAL MATCH ENGINE ================= */

router.post("/ai-match", async (req, res) => {
  try {
    const { preferredLocation, budgetMin, budgetMax, purpose, propertyType, userProfile, requiredAmenities } = req.body;

    const properties = await Property.find({ status: "AVAILABLE" }).populate(
      "owner",
      "name email verified rating successfulDeals trustBadge"
    );

    const preferences = {
      preferredLocation: text(preferredLocation, 120),
      budgetMin: Number(budgetMin) || 0,
      budgetMax: Number(budgetMax) || Infinity,
      purpose,
      propertyType,
      userProfile,
      requiredAmenities: Array.isArray(requiredAmenities) ? requiredAmenities.slice(0, 30) : []
    };

    const scoredProperties = properties.map((prop) => {
      const obj = withScore(prop);
      obj.aiScore = calculateAIMatchScore(prop, preferences);
      return obj;
    });

    res.json({
      success: true,
      totalProperties: scoredProperties.length,
      suggestions: getAISuggestions(scoredProperties),
      allMatches: scoredProperties.sort((a, b) => b.aiScore.totalScore - a.aiScore.totalScore)
    });
  } catch (err) {
    console.error("AI MATCH ERROR:", err);
    res.status(500).json({ message: "Failed to process AI matching" });
  }
});

/* ================= PROPERTY DETAILS ================= */

router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { new: true })
      .populate("owner", OWNER_PUBLIC)
      .populate("assignedTo", "name email");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const obj = withScore(property);
    // Cache the computed score for sorting/analytics without blocking the response
    Property.updateOne(
      { _id: property._id },
      { propertyScore: obj.propertyScore, scoreBreakdown: obj.scoreBreakdown }
    ).catch((err) => console.error("Score cache warning:", err.message));

    res.json(obj);
  } catch (err) {
    if (err.name === "CastError") return res.status(404).json({ message: "Property not found" });
    console.error("PROPERTY DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to load property details" });
  }
});

/* ================= DELETE (owner only) ================= */

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    if (!sameId(property.owner, req.user)) {
      return res.status(403).json({ message: "You can only delete your own listings" });
    }

    const activeAgreement = await RentAgreement.exists({ property: property._id, status: "ACTIVE" });
    if (activeAgreement) {
      return res.status(400).json({ message: "End the active rent agreement before deleting this listing" });
    }

    await Promise.all([
      Notification.deleteMany({ property: property._id }),
      Chat.deleteMany({ property: property._id }),
      Maintenance.deleteMany({ property: property._id }),
      User.updateMany({ savedProperties: property._id }, { $pull: { savedProperties: property._id } }),
      ...(property.images || []).map(deleteImage)
    ]);
    await property.deleteOne();

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete property" });
  }
});

/* ================= UPDATE PROPERTY (owner only) ================= */

router.put("/:id", requireAuth, upload.array("images", MAX_IMAGES), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    if (!sameId(property.owner, req.user)) {
      return res.status(403).json({ message: "You can only edit your own properties" });
    }

    const b = req.body;
    if (b.type !== undefined && !PROPERTY_TYPES.includes(b.type)) {
      return res.status(400).json({ message: "Invalid property type" });
    }
    if (b.purpose !== undefined && !PURPOSES.includes(b.purpose)) {
      return res.status(400).json({ message: "Invalid purpose" });
    }
    if (b.price !== undefined && !positiveNumber(b.price)) {
      return res.status(400).json({ message: "Enter a valid price" });
    }

    let images = property.images || [];
    if (req.files?.length) {
      try {
        const newImageUrls = await uploadMultipleImages(req.files, "auraspot/properties");
        images = [...images, ...newImageUrls].slice(0, MAX_IMAGES);
      } catch (uploadError) {
        console.error("[CLOUDINARY] Upload error:", uploadError);
        return res.status(502).json({ message: "Image upload failed. Please try again." });
      }
    }

    const purpose = b.purpose || property.purpose;
    Object.assign(property, {
      title: text(b.title, 120) || property.title,
      type: b.type || property.type,
      purpose,
      listingType: purpose === "SALE" ? "sale" : "rent",
      price: positiveNumber(b.price) || property.price,
      city: text(b.city, 80) || property.city,
      area: b.area !== undefined ? text(b.area, 120) : property.area,
      description: b.description !== undefined ? text(b.description, 3000) : property.description,
      amenities: b.amenities !== undefined ? parseAmenities(b.amenities) : property.amenities,
      images,
      image: images[0] || property.image,
      bhk: b.bhk !== undefined ? positiveNumber(b.bhk) : property.bhk,
      sqft: b.sqft !== undefined ? positiveNumber(b.sqft) : property.sqft,
      furnishing: FURNISHING.includes(b.furnishing) ? b.furnishing : property.furnishing
    });

    const lat = coordinate(b.latitude, 90);
    const lng = coordinate(b.longitude, 180);
    if (lat !== undefined && lng !== undefined) {
      property.latitude = lat;
      property.longitude = lng;
    }

    await property.save();
    await property.populate("owner", "name email");
    regenerateInsights(property);

    res.json(property);
  } catch (err) {
    console.error("UPDATE PROPERTY ERROR:", err);
    res.status(500).json({ message: "Failed to update property" });
  }
});

/* ================= SEND RENT/BUY REQUEST ================= */

router.post("/:id/request", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    if (sameId(property.owner, user)) {
      return res.status(400).json({ message: "You cannot request your own listing" });
    }
    if (property.status === "BOOKED" || property.status === "SOLD") {
      return res.status(400).json({ message: "Property is no longer available" });
    }

    const existingRequest = await Notification.exists({
      from: user._id,
      property: property._id,
      action: { $in: ["RENT", "BUY"] }
    });
    if (existingRequest) {
      return res.status(400).json({ message: "You have already requested this property" });
    }

    await Property.updateOne({ _id: property._id }, { $inc: { contactRequests: 1 } });
    await Notification.create({
      from: user._id,
      to: property.owner,
      property: property._id,
      action: property.purpose === "RENT" ? "RENT" : "BUY",
      message:
        text(req.body.message, 1000) ||
        `${user.name || user.email} is interested in your ${property.type} for ${property.purpose.toLowerCase()}`
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("SEND REQUEST ERROR:", err);
    res.status(500).json({ message: "Failed to send request" });
  }
});

/* ================= OWNER ACCEPTS A REQUEST ================= */

router.post("/:id/approve", requireAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    if (!sameId(property.owner, req.user)) {
      return res.status(403).json({ message: "Only the owner can accept requests" });
    }
    if (property.status === "BOOKED" || property.status === "SOLD") {
      return res.status(400).json({ message: "Property is already booked/sold" });
    }

    const request = await Notification.exists({
      from: userId,
      to: req.user._id,
      property: property._id,
      action: { $in: ["RENT", "BUY"] }
    });
    if (!request) {
      return res.status(404).json({ message: "This request no longer exists" });
    }

    const tenant = await User.findById(userId);
    if (!tenant) {
      return res.status(404).json({ message: "User not found" });
    }

    property.status = property.purpose === "SALE" ? "SOLD" : "BOOKED";
    property.assignedTo = tenant._id;
    await property.save();

    const owner = req.user;
    owner.successfulDeals = (owner.successfulDeals || 0) + 1;
    owner.trustBadge = calculateTrustBadge(owner);
    await owner.save();

    const notifications = [
      {
        from: owner._id,
        to: tenant._id,
        property: property._id,
        action: "ACCEPTED",
        message: `Your request for ${property.title} has been accepted!`
      }
    ];

    if (property.purpose === "RENT") {
      const startDate = new Date();
      const cycleDay = Math.min(startDate.getDate(), 28);
      const nextPayment = new Date(startDate.getFullYear(), startDate.getMonth() + 1, cycleDay);

      await RentAgreement.create({
        property: property._id,
        owner: owner._id,
        tenant: tenant._id,
        rentAmount: property.price,
        rentalStartDate: startDate,
        nextPaymentDate: nextPayment,
        paymentCycleDay: cycleDay,
        paymentStatus: "PENDING",
        status: "ACTIVE"
      });

      notifications.push({
        from: owner._id,
        to: tenant._id,
        property: property._id,
        action: "RENT_AGREEMENT_CREATED",
        message: `Rent agreement created. Monthly rent: ₹${property.price.toLocaleString("en-IN")}. First payment due ${nextPayment.toDateString()}`
      });
    }

    // Close all other open requests for this listing, informing the other requesters
    const otherRequests = await Notification.find({
      property: property._id,
      action: { $in: ["RENT", "BUY"] },
      from: { $ne: tenant._id }
    });
    for (const other of otherRequests) {
      notifications.push({
        from: owner._id,
        to: other.from,
        property: property._id,
        action: "REJECTED",
        message: `${property.title} is no longer available.`
      });
    }

    await Notification.deleteMany({ property: property._id, action: { $in: ["RENT", "BUY"] } });
    await Notification.create(notifications);

    res.json({ ok: true, property });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: "Failed to approve request" });
  }
});

module.exports = router;
