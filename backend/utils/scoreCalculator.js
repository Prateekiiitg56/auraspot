/**
 * Smart Property Score Calculator
 * Calculates a score out of 100 based on multiple factors
 */

// Premium locations (IT parks, colleges, metro areas)
const PREMIUM_LOCATIONS = {
  // IT Hub Cities
  "bangalore": ["whitefield", "electronic city", "koramangala", "indiranagar", "hsr layout", "marathahalli", "bellandur"],
  "hyderabad": ["hitec city", "gachibowli", "madhapur", "kondapur", "banjara hills", "jubilee hills"],
  "pune": ["hinjewadi", "kharadi", "magarpatta", "viman nagar", "baner", "wakad"],
  "chennai": ["omr", "sholinganallur", "velachery", "adyar", "porur", "guindy"],
  "mumbai": ["powai", "andheri", "bandra", "lower parel", "goregaon", "malad"],
  "delhi": ["gurgaon", "noida", "connaught place", "dwarka", "saket", "nehru place"],
  "kolkata": ["salt lake", "new town", "park street", "rajarhat", "ballygunge"],
  // Tier 2 cities
  "jaipur": ["malviya nagar", "vaishali nagar", "mansarovar", "c scheme"],
  "ahmedabad": ["sg highway", "prahlad nagar", "satellite", "bodakdev"],
  "lucknow": ["gomti nagar", "hazratganj", "aliganj", "indira nagar"]
};

// Average price per sqft by city (for rent in INR)
const AVG_PRICES = {
  "bangalore": { ROOM: 8000, PG: 12000, HOSTEL: 6000, FLAT: 25000, HOME: 35000 },
  "hyderabad": { ROOM: 6000, PG: 10000, HOSTEL: 5000, FLAT: 18000, HOME: 28000 },
  "pune": { ROOM: 7000, PG: 11000, HOSTEL: 5500, FLAT: 20000, HOME: 30000 },
  "chennai": { ROOM: 7000, PG: 10000, HOSTEL: 5000, FLAT: 22000, HOME: 32000 },
  "mumbai": { ROOM: 15000, PG: 18000, HOSTEL: 10000, FLAT: 45000, HOME: 60000 },
  "delhi": { ROOM: 10000, PG: 14000, HOSTEL: 7000, FLAT: 30000, HOME: 45000 },
  "kolkata": { ROOM: 5000, PG: 8000, HOSTEL: 4000, FLAT: 15000, HOME: 22000 },
  "jaipur": { ROOM: 4000, PG: 7000, HOSTEL: 3500, FLAT: 12000, HOME: 18000 },
  "ahmedabad": { ROOM: 5000, PG: 8000, HOSTEL: 4000, FLAT: 14000, HOME: 20000 },
  "lucknow": { ROOM: 4000, PG: 6000, HOSTEL: 3000, FLAT: 10000, HOME: 15000 },
  "default": { ROOM: 6000, PG: 9000, HOSTEL: 4500, FLAT: 18000, HOME: 25000 }
};

// Valuable amenities with points
const AMENITY_POINTS = {
  "wifi": 3,
  "wi-fi": 3,
  "internet": 3,
  "ac": 3,
  "air conditioning": 3,
  "parking": 2,
  "gym": 2,
  "swimming pool": 3,
  "pool": 3,
  "security": 2,
  "24/7 security": 3,
  "cctv": 2,
  "power backup": 2,
  "lift": 1,
  "elevator": 1,
  "furnished": 3,
  "semi-furnished": 2,
  "washing machine": 2,
  "geyser": 1,
  "hot water": 1,
  "balcony": 1,
  "garden": 1,
  "terrace": 1,
  "food": 2,
  "meals": 2,
  "laundry": 1,
  "housekeeping": 2,
  "tv": 1,
  "fridge": 1,
  "refrigerator": 1,
  "microwave": 1,
  "kitchen": 2,
  "attached bathroom": 2,
  "private bathroom": 2
};

/**
 * Calculate location score (0-25 points)
 */
function calculateLocationScore(city, area) {
  const cityLower = (city || "").toLowerCase().trim();
  const areaLower = (area || "").toLowerCase().trim();
  
  // Check if city is a major tech hub
  const isMajorCity = ["bangalore", "hyderabad", "pune", "mumbai", "delhi", "chennai"].includes(cityLower);
  let score = isMajorCity ? 10 : 5;
  
  // Check if area is premium
  const premiumAreas = PREMIUM_LOCATIONS[cityLower] || [];
  const isPremiumArea = premiumAreas.some(pa => areaLower.includes(pa) || pa.includes(areaLower));
  
  if (isPremiumArea) {
    score += 15;
  } else if (premiumAreas.length > 0) {
    // City has premium areas but this isn't one
    score += 5;
  } else {
    score += 8; // Unknown city, give moderate score
  }
  
  return Math.min(score, 25);
}

/**
 * Calculate price fairness score (0-25 points)
 */
function calculatePriceFairnessScore(city, type, price) {
  const cityLower = (city || "").toLowerCase().trim();
  const avgPrices = AVG_PRICES[cityLower] || AVG_PRICES["default"];
  const avgPrice = avgPrices[type] || avgPrices["FLAT"];
  
  if (!price || price <= 0) return 10;
  
  const ratio = price / avgPrice;
  
  // Price is much lower than average (great deal)
  if (ratio <= 0.6) return 25;
  if (ratio <= 0.8) return 22;
  if (ratio <= 1.0) return 20;
  if (ratio <= 1.2) return 15;
  if (ratio <= 1.5) return 10;
  if (ratio <= 2.0) return 5;
  
  return 2; // Very overpriced
}

/**
 * Calculate amenities score (0-20 points)
 */
function calculateAmenitiesScore(amenities) {
  if (!amenities || !Array.isArray(amenities) || amenities.length === 0) {
    return 0;
  }
  
  let totalPoints = 0;
  
  amenities.forEach(amenity => {
    const amenityLower = (amenity || "").toLowerCase().trim();
    
    // Check for exact match or partial match
    for (const [key, points] of Object.entries(AMENITY_POINTS)) {
      if (amenityLower.includes(key) || key.includes(amenityLower)) {
        totalPoints += points;
        break;
      }
    }
  });
  
  // Cap at 20 points
  return Math.min(totalPoints, 20);
}

/**
 * Calculate demand score (0-15 points)
 */
function calculateDemandScore(viewCount, contactRequests) {
  const views = viewCount || 0;
  const requests = contactRequests || 0;
  
  let score = 0;
  
  // Views contribution (max 7 points)
  if (views >= 100) score += 7;
  else if (views >= 50) score += 5;
  else if (views >= 20) score += 3;
  else if (views >= 5) score += 1;
  
  // Contact requests contribution (max 8 points)
  if (requests >= 10) score += 8;
  else if (requests >= 5) score += 6;
  else if (requests >= 3) score += 4;
  else if (requests >= 1) score += 2;
  
  return Math.min(score, 15);
}

/**
 * Calculate owner credibility score (0-15 points)
 */
function calculateOwnerCredibilityScore(owner) {
  if (!owner) return 5; // Default score for unknown owner
  
  let score = 0;
  
  // Verified status (3 points)
  if (owner.verified) score += 3;
  
  // Google login (2 points)
  if (owner.isGoogleLogin) score += 2;
  
  // Email verified (1 point)
  if (owner.emailVerified) score += 1;
  
  // Phone verified (2 points)
  if (owner.phoneVerified) score += 2;
  
  // Rating contribution (max 4 points)
  const rating = owner.rating || 0;
  if (rating >= 4.5) score += 4;
  else if (rating >= 4.0) score += 3;
  else if (rating >= 3.5) score += 2;
  else if (rating >= 3.0) score += 1;
  
  // Successful deals (max 3 points)
  const deals = owner.successfulDeals || 0;
  if (deals >= 10) score += 3;
  else if (deals >= 5) score += 2;
  else if (deals >= 1) score += 1;
  
  return Math.min(score, 15);
}

/**
 * Calculate trust badge for user
 */
function calculateTrustBadge(user) {
  if (!user) return "NEW_SELLER";
  
  const { verified, isGoogleLogin, emailVerified, phoneVerified, rating, successfulDeals } = user;
  
  // TOP_SELLER: 10+ deals, 4.5+ rating
  if ((successfulDeals || 0) >= 10 && (rating || 0) >= 4.5) {
    return "TOP_SELLER";
  }
  
  // TRUSTED_SELLER: 3+ deals, 4+ rating
  if ((successfulDeals || 0) >= 3 && (rating || 0) >= 4.0) {
    return "TRUSTED_SELLER";
  }
  
  // VERIFIED_OWNER: Has verification (Google login OR verified docs OR both phone & email)
  if (verified || isGoogleLogin || (emailVerified && phoneVerified)) {
    return "VERIFIED_OWNER";
  }
  
  return "NEW_SELLER";
}

/**
 * Get badge display info
 */
function getBadgeInfo(badge) {
  const badges = {
    "NEW_SELLER": { emoji: "🆕", label: "New Seller", color: "#6b7280" },
    "VERIFIED_OWNER": { emoji: "✅", label: "Verified Owner", color: "#10b981" },
    "TRUSTED_SELLER": { emoji: "⭐", label: "Trusted Seller", color: "#f59e0b" },
    "TOP_SELLER": { emoji: "🏆", label: "Top Seller", color: "#8b5cf6" }
  };
  return badges[badge] || badges["NEW_SELLER"];
}

/**
 * Calculate full property score
 */
function calculatePropertyScore(property, owner) {
  const locationScore = calculateLocationScore(property.city, property.area);
  const priceFairnessScore = calculatePriceFairnessScore(property.city, property.type, property.price);
  const amenitiesScore = calculateAmenitiesScore(property.amenities);
  const demandScore = calculateDemandScore(property.viewCount, property.contactRequests);
  const ownerCredibilityScore = calculateOwnerCredibilityScore(owner);
  
  const totalScore = locationScore + priceFairnessScore + amenitiesScore + demandScore + ownerCredibilityScore;
  
  return {
    totalScore: Math.min(totalScore, 100),
    breakdown: {
      location: locationScore,
      priceFairness: priceFairnessScore,
      amenities: amenitiesScore,
      demand: demandScore,
      ownerCredibility: ownerCredibilityScore
    }
  };
}

/**
 * Generate score description
 */
function getScoreDescription(score, breakdown) {
  const parts = [];
  
  if (breakdown.location >= 20) parts.push("great location");
  else if (breakdown.location >= 15) parts.push("good location");
  
  if (breakdown.priceFairness >= 20) parts.push("fair price");
  else if (breakdown.priceFairness <= 10) parts.push("premium priced");
  
  if (breakdown.demand >= 10) parts.push("high demand");
  else if (breakdown.demand >= 5) parts.push("moderate demand");
  
  if (breakdown.amenities >= 15) parts.push("well-equipped");
  
  if (breakdown.ownerCredibility >= 12) parts.push("trusted owner");
  
  if (parts.length === 0) {
    if (score >= 70) parts.push("recommended");
    else if (score >= 50) parts.push("decent option");
    else parts.push("basic listing");
  }
  
  return parts.slice(0, 3).join(" • ");
}

module.exports = {
  calculatePropertyScore,
  calculateTrustBadge,
  getBadgeInfo,
  getScoreDescription,
  calculateLocationScore,
  calculatePriceFairnessScore,
  calculateAmenitiesScore,
  calculateDemandScore,
  calculateOwnerCredibilityScore
};
