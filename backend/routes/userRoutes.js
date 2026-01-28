const router = require("express").Router();
const User = require("../models/User");

// Store OTPs in memory (in production, use Redis or database)
const otpStore = {};

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post("/sync", async (req, res) => {
  try {
    const { firebaseUid, name, email } = req.body;

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = await User.create({
        firebaseUid,
        name,
        email,
        role: "USER"
      });
    }

    res.json(user);
  } catch (err) {
    console.error("USER SYNC ERROR:", err);
    res.status(500).json({ message: "Failed to sync user" });
  }
});
router.get("/email/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    console.error("GET USER BY EMAIL ERROR:", err);
    res.status(500).json({ message: "Failed to get user" });
  }
});

// Update user profile
router.put("/profile", async (req, res) => {
  try {
    const { email, name, phone, location, bio, socials } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { name, phone, location, bio, socials },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Submit verification documents
router.post("/verify", async (req, res) => {
  try {
    const { email, documentType, documentNumber } = req.body;

    if (!email || !documentType || !documentNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add verification document
    user.verificationDocuments.push({
      type: documentType,
      documentNumber,
      uploadedAt: new Date()
    });

    // Auto-verify if document is submitted (in production, this would be manual review)
    user.verified = true;

    await user.save();

    res.json({ message: "Verification submitted successfully", user });
  } catch (err) {
    console.error("VERIFICATION ERROR:", err);
    res.status(500).json({ message: "Failed to submit verification" });
  }
});

// Send OTP for phone verification
router.post("/send-otp", async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ message: "Email and phone are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with timestamp (expires in 5 minutes)
    otpStore[phone] = {
      otp,
      email,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    };

    // In production, send OTP via SMS service like Twilio
    // For now, we'll log it and return in development
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ 
      message: "OTP sent successfully",
      // In production, remove this line. For testing only:
      otp: process.env.NODE_ENV === "production" ? undefined : otp
    });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Verify OTP and update phone
router.post("/verify-phone-otp", async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!email || !phone || !otp) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otpData = otpStore[phone];

    // Check if OTP exists
    if (!otpData) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiresAt) {
      delete otpStore[phone];
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    // Check attempt limit
    if (otpData.attempts >= 3) {
      delete otpStore[phone];
      return res.status(400).json({ message: "Too many attempts. Please request a new OTP." });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      otpData.attempts++;
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // Check email matches
    if (otpData.email !== email) {
      return res.status(400).json({ message: "Email does not match OTP request." });
    }

    // Update phone number
    const user = await User.findOneAndUpdate(
      { email },
      { phone },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear OTP after successful verification
    delete otpStore[phone];

    res.json({ 
      message: "Phone verified and updated successfully",
      user
    });
  } catch (err) {
    console.error("VERIFY PHONE OTP ERROR:", err);
    res.status(500).json({ message: "Failed to verify phone OTP" });
  }
});

module.exports = router;
