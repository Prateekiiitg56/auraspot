const router = require("express").Router();
const User = require("../models/User");
const Property = require("../models/Property");
const Rating = require("../models/Rating");
const { calculateTrustBadge, getBadgeInfo } = require("../utils/scoreCalculator");
const { requireAuth, requireFirebaseUser, optionalAuth, sameId } = require("../middleware/auth");

const PUBLIC_FIELDS =
  "name email location bio socials verified rating totalRatings successfulDeals trustBadge isGoogleLogin emailVerified phoneVerified createdAt";

const DOCUMENT_TYPES = ["AADHAR", "PAN", "DRIVING_LICENSE", "PASSPORT"];
const SOCIAL_KEYS = ["facebook", "twitter", "linkedin", "instagram", "youtube"];

const clip = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : undefined);

// OTPs are kept in memory. This only works on a single long-running instance;
// wire an SMS provider + shared store (e.g. Redis) before enabling phone OTP in production.
const otpStore = new Map();
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* ================= SYNC (called after every Firebase sign-in) ================= */

router.post("/sync", requireFirebaseUser, async (req, res) => {
  try {
    const { uid, email, email_verified: emailVerified, firebase } = req.firebaseUser;
    if (!email) {
      return res.status(400).json({ message: "Your sign-in method did not provide an email address" });
    }

    const isGoogleLogin = firebase?.sign_in_provider === "google.com";
    const name = clip(req.body.name, 80) || req.firebaseUser.name || email.split("@")[0];

    // Match by UID first, then by email (account re-created in Firebase with same email)
    let user = req.user || (await User.findOne({ email }));

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        name,
        email,
        isGoogleLogin,
        emailVerified: !!emailVerified,
        trustBadge: "NEW_SELLER"
      });
    } else {
      let changed = false;
      // Sign-up sets the display name right after the account is created
      const requestedName = clip(req.body.name, 80);
      if (requestedName && user.name === email.split("@")[0] && requestedName !== user.name) {
        user.name = requestedName;
        changed = true;
      }
      if (user.firebaseUid !== uid) {
        user.firebaseUid = uid;
        changed = true;
      }
      if (isGoogleLogin && !user.isGoogleLogin) {
        user.isGoogleLogin = true;
        changed = true;
      }
      if (emailVerified && !user.emailVerified) {
        user.emailVerified = true;
        changed = true;
      }
      if (changed) {
        user.trustBadge = calculateTrustBadge(user);
        await user.save();
      }
    }

    res.json(user);
  } catch (err) {
    console.error("USER SYNC ERROR:", err);
    res.status(500).json({ message: "Failed to sync user" });
  }
});

/* ================= CURRENT USER ================= */

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

/* ================= SAVED PROPERTIES ================= */

router.get("/me/saved", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedProperties",
      populate: { path: "owner", select: "name verified trustBadge" }
    });
    // Drop references to deleted listings
    res.json((user.savedProperties || []).filter(Boolean));
  } catch (err) {
    console.error("GET SAVED ERROR:", err);
    res.status(500).json({ message: "Failed to load saved properties" });
  }
});

router.post("/me/saved/:propertyId", requireAuth, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const exists = await Property.exists({ _id: propertyId });
    if (!exists) return res.status(404).json({ message: "Property not found" });

    const isSaved = (req.user.savedProperties || []).some((id) => sameId(id, propertyId));
    await User.updateOne(
      { _id: req.user._id },
      isSaved ? { $pull: { savedProperties: propertyId } } : { $addToSet: { savedProperties: propertyId } }
    );
    res.json({ saved: !isSaved });
  } catch (err) {
    console.error("TOGGLE SAVED ERROR:", err);
    res.status(500).json({ message: "Failed to update saved properties" });
  }
});

/* ================= PROFILE LOOKUP ================= */

router.get("/email/:email", optionalAuth, async (req, res) => {
  try {
    const isSelf = req.user && req.user.email.toLowerCase() === req.params.email.toLowerCase();
    if (isSelf) return res.json(req.user);

    const user = await User.findOne({ email: req.params.email }).select(PUBLIC_FIELDS);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("GET USER BY EMAIL ERROR:", err);
    res.status(500).json({ message: "Failed to get user" });
  }
});

/* ================= UPDATE PROFILE ================= */

router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name, phone, location, bio, socials } = req.body;
    const update = {};

    if (name !== undefined) {
      const trimmed = clip(name, 80);
      if (!trimmed) return res.status(400).json({ message: "Name cannot be empty" });
      update.name = trimmed;
    }
    if (location !== undefined) update.location = clip(location, 120) || "";
    if (bio !== undefined) update.bio = clip(bio, 500) || "";
    if (phone !== undefined && clip(phone, 20) !== req.user.phone) {
      // Changing the number removes the verified status
      update.phone = clip(phone, 20) || "";
      update.phoneVerified = false;
    }
    if (socials && typeof socials === "object") {
      for (const key of SOCIAL_KEYS) {
        if (socials[key] !== undefined) update[`socials.${key}`] = clip(socials[key], 200) || "";
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

/* ================= IDENTITY VERIFICATION ================= */

router.post("/verify", requireAuth, async (req, res) => {
  try {
    const { documentType } = req.body;
    const documentNumber = clip(req.body.documentNumber, 30);

    if (!DOCUMENT_TYPES.includes(documentType) || !documentNumber || documentNumber.length < 4) {
      return res.status(400).json({ message: "Select a document type and enter a valid document number" });
    }

    const user = req.user;
    user.verificationDocuments.push({ type: documentType, documentNumber, uploadedAt: new Date() });
    // NOTE: documents are accepted automatically. Replace with a manual/KYC-provider review before launch.
    user.verified = true;
    user.trustBadge = calculateTrustBadge(user);
    await user.save();

    res.json({ message: "Verification submitted successfully", user });
  } catch (err) {
    console.error("VERIFICATION ERROR:", err);
    res.status(500).json({ message: "Failed to submit verification" });
  }
});

/* ================= PHONE OTP ================= */

router.post("/send-otp", requireAuth, async (req, res) => {
  try {
    const phone = clip(req.body.phone, 20);
    if (!phone || !/^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ""))) {
      return res.status(400).json({ message: "Enter a valid phone number" });
    }

    const otp = generateOTP();
    otpStore.set(req.user.email, { otp, phone, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });

    res.json({
      message: "OTP sent successfully",
      // No SMS provider is configured: expose the code outside production for testing only
      otp: process.env.NODE_ENV === "production" ? undefined : otp
    });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/verify-phone-otp", requireAuth, async (req, res) => {
  try {
    const phone = clip(req.body.phone, 20);
    const otp = clip(req.body.otp, 6);
    const otpData = otpStore.get(req.user.email);

    if (!otpData || otpData.phone !== phone) {
      return res.status(400).json({ message: "No OTP found for this number. Please request a new one." });
    }
    if (Date.now() > otpData.expiresAt || otpData.attempts >= 3) {
      otpStore.delete(req.user.email);
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }
    if (otpData.otp !== otp) {
      otpData.attempts++;
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }

    otpStore.delete(req.user.email);
    req.user.phone = phone;
    req.user.phoneVerified = true;
    req.user.trustBadge = calculateTrustBadge(req.user);
    await req.user.save();

    res.json({ message: "Phone verified successfully", user: req.user });
  } catch (err) {
    console.error("VERIFY PHONE OTP ERROR:", err);
    res.status(500).json({ message: "Failed to verify phone OTP" });
  }
});

/* ================= USER STATS ================= */

router.get("/stats/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const [propertiesListed, activeDeals, completedDeals, user] = await Promise.all([
      Property.countDocuments({ owner: userId }),
      Property.countDocuments({ owner: userId, status: { $in: ["REQUESTED", "BOOKED"] } }),
      Property.countDocuments({ owner: userId, status: "SOLD" }),
      User.findById(userId)
    ]);

    res.json({
      propertiesListed,
      activeDeals,
      completedDeals,
      totalDeals: activeDeals + completedDeals,
      rating: user?.rating || 0,
      totalRatings: user?.totalRatings || 0,
      successfulDeals: user?.successfulDeals || 0,
      trustBadge: user?.trustBadge || "NEW_SELLER",
      badgeInfo: getBadgeInfo(user?.trustBadge)
    });
  } catch (err) {
    console.error("USER STATS ERROR:", err);
    res.status(500).json({ message: "Failed to get user stats" });
  }
});

/* ================= RATE USER (after a completed deal) ================= */

router.post("/rate", requireAuth, async (req, res) => {
  try {
    const { rateeEmail, propertyId } = req.body;
    const rating = Number(req.body.rating);
    const review = clip(req.body.review, 1000) || "";

    if (!rateeEmail || !propertyId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "A rating between 1 and 5 is required" });
    }

    const rater = req.user;
    const [ratee, property] = await Promise.all([
      User.findOne({ email: rateeEmail }),
      Property.findById(propertyId)
    ]);

    if (!ratee || !property) {
      return res.status(404).json({ message: "User or property not found" });
    }
    if (sameId(ratee, rater)) {
      return res.status(400).json({ message: "You cannot rate yourself" });
    }

    // Only the two parties of this deal may rate each other
    const tenantRatesOwner = sameId(property.assignedTo, rater) && sameId(property.owner, ratee);
    const ownerRatesTenant = sameId(property.owner, rater) && sameId(property.assignedTo, ratee);
    if (!tenantRatesOwner && !ownerRatesTenant) {
      return res.status(403).json({ message: "You can only rate the other party of a completed deal" });
    }

    await Rating.create({
      rater: rater._id,
      ratee: ratee._id,
      property: property._id,
      rating,
      review,
      ratingType: tenantRatesOwner ? "TENANT_TO_OWNER" : "OWNER_TO_TENANT"
    });

    const newTotalRatings = (ratee.totalRatings || 0) + 1;
    const newRating = ((ratee.rating || 0) * (ratee.totalRatings || 0) + rating) / newTotalRatings;
    ratee.rating = Math.round(newRating * 10) / 10;
    ratee.totalRatings = newTotalRatings;
    ratee.trustBadge = calculateTrustBadge(ratee);
    await ratee.save();

    res.json({
      message: "Rating submitted successfully",
      newRating: ratee.rating,
      totalRatings: ratee.totalRatings,
      trustBadge: ratee.trustBadge,
      badgeInfo: getBadgeInfo(ratee.trustBadge)
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already rated this user for this deal" });
    }
    console.error("RATE USER ERROR:", err);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

router.get("/rating/check", requireAuth, async (req, res) => {
  try {
    const { rateeEmail, propertyId } = req.query;
    if (!rateeEmail || !propertyId) {
      return res.status(400).json({ message: "Ratee email and property ID are required" });
    }

    const ratee = await User.findOne({ email: rateeEmail });
    if (!ratee) return res.json({ hasRated: false });

    const existingRating = await Rating.findOne({ rater: req.user._id, ratee: ratee._id, property: propertyId });
    res.json({
      hasRated: !!existingRating,
      rating: existingRating ? existingRating.rating : null,
      review: existingRating ? existingRating.review : null
    });
  } catch (err) {
    console.error("CHECK RATING ERROR:", err);
    res.status(500).json({ message: "Failed to check rating" });
  }
});

router.get("/ratings/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ratings = await Rating.find({ ratee: user._id })
      .populate("rater", "name email")
      .populate("property", "title city area")
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (err) {
    console.error("GET RATINGS ERROR:", err);
    res.status(500).json({ message: "Failed to get ratings" });
  }
});

/* ================= OWNER PUBLIC PROFILE ================= */

router.get("/owner/:ownerId", async (req, res) => {
  try {
    const owner = await User.findById(req.params.ownerId).select(PUBLIC_FIELDS);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const propertiesCount = await Property.countDocuments({ owner: req.params.ownerId });
    res.json({ ...owner.toObject(), propertiesCount, badgeInfo: getBadgeInfo(owner.trustBadge) });
  } catch (err) {
    console.error("GET OWNER ERROR:", err);
    res.status(500).json({ message: "Failed to get owner profile" });
  }
});

module.exports = router;
