/**
 * AI Routes - Single Endpoint Architecture
 * All AI features through unified API
 */

const express = require("express");
const router = express.Router();
const aiService = require("../services/aiService");
const Property = require("../models/Property");
const { requireAuth } = require("../middleware/auth");

// Helper to remove undefined values from aiInsights before saving
const sanitizeAiInsights = (existingInsights, newData) => {
  const sanitized = {};
  const combined = { ...existingInsights, ...newData };
  
  for (const [key, value] of Object.entries(combined)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/* ================= PROPERTY SCORE ================= */

// Get AI score for a property
router.get("/score/:propertyId", async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if we have cached insights in DB
    if (property.aiInsights?.score && property.aiInsights?.generatedAt) {
      const hoursSinceGenerated = (Date.now() - new Date(property.aiInsights.generatedAt)) / (1000 * 60 * 60);
      if (hoursSinceGenerated < 24) {
        return res.json({
          cached: true,
          score: property.aiInsights.score,
          priceRating: property.aiInsights.priceRating,
          locationQuality: property.aiInsights.locationQuality,
          highlights: property.aiInsights.highlights || [],
          concerns: property.aiInsights.concerns || [],
          summary: property.aiInsights.summary || "Analysis available"
        });
      }
    }

    // Generate fresh score
    const scoreData = await aiService.generatePropertyScore(property);
    
    if (scoreData && scoreData.score) {
      // Save to property with sanitized insights
      property.aiInsights = sanitizeAiInsights(property.aiInsights?.toObject?.() || property.aiInsights || {}, {
        score: scoreData.score,
        priceRating: scoreData.priceRating,
        locationQuality: scoreData.locationQuality,
        highlights: scoreData.highlights || [],
        concerns: scoreData.concerns || [],
        summary: scoreData.summary,
        generatedAt: new Date()
      });
      
      try {
        await property.save();
      } catch (saveErr) {
        console.warn("[AI] Failed to cache score, continuing:", saveErr.message);
      }
      
      return res.json({ cached: false, ...scoreData });
    }
    
    // AI unavailable: say so instead of inventing a score
    return res.json({ available: false });
  } catch (error) {
    console.error("AI Score error:", error);
    res.json({ available: false });
  }
});

/* ================= FRAUD DETECTION ================= */

// Check fraud risk for a property
router.get("/fraud-check/:propertyId", async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId).populate("owner", "name email createdAt");
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check cached fraud data
    if (property.aiInsights?.fraudRisk && property.aiInsights?.generatedAt) {
      const hoursSinceGenerated = (Date.now() - new Date(property.aiInsights.generatedAt)) / (1000 * 60 * 60);
      if (hoursSinceGenerated < 24) {
        return res.json({
          cached: true,
          riskLevel: property.aiInsights.fraudRisk,
          riskScore: property.aiInsights.fraudScore,
          flags: property.aiInsights.fraudFlags
        });
      }
    }

    const ownerInfo = {
      verified: property.owner?.verified || false,
      memberSince: property.owner?.createdAt
    };

    const fraudData = await aiService.calculateFraudRisk(property, ownerInfo);
    
    if (fraudData) {
      property.aiInsights = sanitizeAiInsights(property.aiInsights?.toObject?.() || property.aiInsights || {}, {
        fraudRisk: fraudData.riskLevel,
        fraudScore: fraudData.riskScore,
        fraudFlags: fraudData.flags,
        generatedAt: new Date()
      });
      
      try {
        await property.save();
      } catch (saveErr) {
        console.warn("[AI] Failed to cache fraud data, continuing:", saveErr.message);
      }
    }

    res.json(fraudData ? { cached: false, ...fraudData } : { available: false });
  } catch (error) {
    console.error("Fraud check error:", error);
    res.json({ available: false });
  }
});

/* ================= RENT SUGGESTION ================= */

// Get smart rent suggestion
router.get("/rent-suggestion/:propertyId", async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.listingType !== "rent") {
      return res.status(400).json({ message: "Rent suggestion only available for rental properties" });
    }

    // Check cached suggestion
    if (property.aiInsights?.rentSuggestion && property.aiInsights?.generatedAt) {
      const hoursSinceGenerated = (Date.now() - new Date(property.aiInsights.generatedAt)) / (1000 * 60 * 60);
      if (hoursSinceGenerated < 48) {
        return res.json({ cached: true, ...property.aiInsights.rentSuggestion });
      }
    }

    const rentData = await aiService.suggestRentPrice(property);
    
    if (rentData) {
      property.aiInsights = sanitizeAiInsights(property.aiInsights?.toObject?.() || property.aiInsights || {}, {
        rentSuggestion: rentData,
        generatedAt: new Date()
      });
      
      try {
        await property.save();
      } catch (saveErr) {
        console.warn("[AI] Failed to cache rent suggestion, continuing:", saveErr.message);
      }
    }

    res.json(rentData ? { cached: false, ...rentData } : { available: false });
  } catch (error) {
    console.error("Rent suggestion error:", error);
    res.json({ available: false });
  }
});

/* ================= AI CHAT ================= */

// Property-specific chat
router.post("/chat/:propertyId", requireAuth, async (req, res) => {
  try {
    const question = typeof req.body.question === "string" ? req.body.question.trim().slice(0, 500) : "";
    if (!question) {
      return res.status(400).json({ message: "Ask a question about this property" });
    }
    const chatHistory = Array.isArray(req.body.chatHistory)
      ? req.body.chatHistory
          .slice(-6)
          .map((m) => ({ role: m?.role === "user" ? "user" : "assistant", content: String(m?.content || "").slice(0, 1000) }))
      : [];
    
    const property = await Property.findById(req.params.propertyId).populate("owner", "name");
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const propertyDetails = `
Title: ${property.title}
Type: ${property.type} (${property.listingType})
Location: ${property.area || ""}, ${property.city}
Price: ₹${property.price.toLocaleString()}${property.listingType === "rent" ? "/month" : ""}
BHK: ${property.bhk || "N/A"}
Sqft: ${property.sqft || "N/A"}
Furnishing: ${property.furnishing || "N/A"}
Amenities: ${property.amenities?.join(", ") || "Not specified"}
Description: ${property.description || "No description"}
Owner: ${property.owner?.name || "Unknown"}
AI Score: ${property.aiInsights?.score || "Not rated"}
Price Rating: ${property.aiInsights?.priceRating || "Not analyzed"}
`;

    // Pass the property object for market data context
    const response = await aiService.propertyChat(propertyDetails, question, chatHistory);
    res.json({ response });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.status(502).json({ message: "The AI assistant is unavailable right now. Please try again shortly." });
  }
});

module.exports = router;
