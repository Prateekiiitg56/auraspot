/**
 * AI Rental Match Engine
 * Calculates personalized property scores based on user preferences
 */

// Haversine formula to calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Location coordinates for common areas (expandable)
const LOCATION_COORDS = {
  // Delhi NCR
  "delhi": { lat: 28.6139, lon: 77.2090 },
  "noida": { lat: 28.5355, lon: 77.3910 },
  "gurgaon": { lat: 28.4595, lon: 77.0266 },
  "greater noida": { lat: 28.4744, lon: 77.5040 },
  // Mumbai
  "mumbai": { lat: 19.0760, lon: 72.8777 },
  "navi mumbai": { lat: 19.0330, lon: 73.0297 },
  "thane": { lat: 19.2183, lon: 72.9781 },
  // Bangalore
  "bangalore": { lat: 12.9716, lon: 77.5946 },
  "bengaluru": { lat: 12.9716, lon: 77.5946 },
  "electronic city": { lat: 12.8456, lon: 77.6603 },
  "whitefield": { lat: 12.9698, lon: 77.7500 },
  // Hyderabad
  "hyderabad": { lat: 17.3850, lon: 78.4867 },
  "secunderabad": { lat: 17.4399, lon: 78.4983 },
  // Chennai
  "chennai": { lat: 13.0827, lon: 80.2707 },
  // Pune
  "pune": { lat: 18.5204, lon: 73.8567 },
  // Kolkata
  "kolkata": { lat: 22.5726, lon: 88.3639 },
  // Generic
  "central": { lat: 28.6139, lon: 77.2090 }
};

// Profile-type compatibility mapping
const PROFILE_TYPE_COMPATIBILITY = {
  "student": {
    "HOSTEL": 100,
    "PG": 90,
    "ROOM": 80,
    "FLAT": 50,
    "HOME": 30
  },
  "worker": {
    "FLAT": 100,
    "PG": 85,
    "ROOM": 75,
    "HOSTEL": 60,
    "HOME": 70
  },
  "family": {
    "HOME": 100,
    "FLAT": 90,
    "PG": 30,
    "ROOM": 20,
    "HOSTEL": 10
  },
  "couple": {
    "FLAT": 100,
    "HOME": 90,
    "ROOM": 60,
    "PG": 40,
    "HOSTEL": 20
  }
};

// Profile-amenity relevance
const PROFILE_AMENITIES = {
  "student": ["wifi", "study room", "library", "laundry", "mess", "canteen", "parking"],
  "worker": ["wifi", "parking", "gym", "ac", "furnished", "power backup", "security"],
  "family": ["parking", "garden", "playground", "security", "power backup", "water supply", "school nearby"],
  "couple": ["wifi", "ac", "furnished", "parking", "gym", "balcony", "modular kitchen"]
};

/**
 * Calculate AI Match Score for a property based on user preferences
 * @param {Object} property - The property to score
 * @param {Object} preferences - User preferences
 * @returns {Object} Score breakdown and total score
 */
const calculateAIMatchScore = (property, preferences) => {
  const breakdown = {
    location: 0,      // 30% weight
    budget: 0,        // 25% weight
    propertyType: 0,  // 15% weight
    amenities: 0,     // 15% weight
    profileMatch: 0   // 15% weight
  };

  // 1. Location Match (30 points)
  if (preferences.preferredLocation && property.city) {
    const prefLocation = preferences.preferredLocation.toLowerCase();
    const propCity = property.city.toLowerCase();
    const propArea = (property.area || "").toLowerCase();
    
    // Exact city/area match
    if (propCity === prefLocation || propArea.includes(prefLocation) || prefLocation.includes(propCity)) {
      breakdown.location = 30;
    } else {
      // Calculate distance-based score
      const prefCoords = LOCATION_COORDS[prefLocation] || null;
      const propLat = property.latitude;
      const propLon = property.longitude;
      
      if (prefCoords && propLat && propLon) {
        const distance = calculateDistance(prefCoords.lat, prefCoords.lon, propLat, propLon);
        // Score based on distance (closer = higher score)
        if (distance <= 5) breakdown.location = 28;      // Within 5km
        else if (distance <= 10) breakdown.location = 24; // Within 10km
        else if (distance <= 20) breakdown.location = 18; // Within 20km
        else if (distance <= 50) breakdown.location = 12; // Within 50km
        else breakdown.location = 5;                      // Far away
      } else {
        // Partial string match fallback
        if (propCity.includes(prefLocation.substring(0, 3)) || 
            prefLocation.includes(propCity.substring(0, 3))) {
          breakdown.location = 15;
        } else {
          breakdown.location = 5;
        }
      }
    }
  }

  // 2. Budget Fit (25 points)
  if (preferences.budgetMin !== undefined && preferences.budgetMax !== undefined) {
    const price = property.price;
    const min = preferences.budgetMin;
    const max = preferences.budgetMax;
    
    if (price >= min && price <= max) {
      // Perfect fit - calculate how centered it is
      const midpoint = (min + max) / 2;
      const deviation = Math.abs(price - midpoint) / midpoint;
      breakdown.budget = Math.round(25 - (deviation * 5)); // 20-25 points for in-range
      breakdown.budget = Math.max(20, Math.min(25, breakdown.budget));
    } else if (price < min) {
      // Under budget - still good!
      const underPercent = ((min - price) / min) * 100;
      if (underPercent <= 20) breakdown.budget = 22;
      else breakdown.budget = 18;
    } else {
      // Over budget
      const overPercent = ((price - max) / max) * 100;
      if (overPercent <= 10) breakdown.budget = 15;      // Slightly over
      else if (overPercent <= 25) breakdown.budget = 10; // Moderately over
      else if (overPercent <= 50) breakdown.budget = 5;  // Significantly over
      else breakdown.budget = 0;                          // Way over budget
    }
  }

  // 3. Property Type Fit (15 points)
  if (preferences.propertyType && property.type) {
    if (property.type === preferences.propertyType) {
      breakdown.propertyType = 15;
    } else {
      // Partial match based on similar types
      const similarTypes = {
        "FLAT": ["HOME", "ROOM"],
        "HOME": ["FLAT"],
        "PG": ["HOSTEL", "ROOM"],
        "HOSTEL": ["PG", "ROOM"],
        "ROOM": ["PG", "HOSTEL", "FLAT"]
      };
      if (similarTypes[preferences.propertyType]?.includes(property.type)) {
        breakdown.propertyType = 8;
      } else {
        breakdown.propertyType = 3;
      }
    }
  }

  // 4. Purpose Match (bonus - affects other scores)
  let purposeMultiplier = 1;
  if (preferences.purpose && property.purpose) {
    if (property.purpose === preferences.purpose) {
      purposeMultiplier = 1;
    } else {
      purposeMultiplier = 0.7; // Reduce score if purpose doesn't match
    }
  }

  // 5. Amenities Match (15 points)
  if (preferences.requiredAmenities && preferences.requiredAmenities.length > 0 && property.amenities) {
    const propAmenities = property.amenities.map(a => a.toLowerCase());
    const reqAmenities = preferences.requiredAmenities.map(a => a.toLowerCase());
    
    let matchCount = 0;
    reqAmenities.forEach(req => {
      if (propAmenities.some(pa => pa.includes(req) || req.includes(pa))) {
        matchCount++;
      }
    });
    
    const matchPercent = matchCount / reqAmenities.length;
    breakdown.amenities = Math.round(15 * matchPercent);
  }

  // 6. Profile Relevance (15 points)
  if (preferences.userProfile && property.type) {
    const profile = preferences.userProfile.toLowerCase();
    const compatibility = PROFILE_TYPE_COMPATIBILITY[profile];
    
    if (compatibility && compatibility[property.type]) {
      breakdown.profileMatch = Math.round((compatibility[property.type] / 100) * 15);
    }
    
    // Bonus for profile-specific amenities
    const profileAmenities = PROFILE_AMENITIES[profile] || [];
    if (property.amenities && profileAmenities.length > 0) {
      const propAmenities = property.amenities.map(a => a.toLowerCase());
      let bonusMatches = 0;
      profileAmenities.forEach(pa => {
        if (propAmenities.some(a => a.includes(pa) || pa.includes(a))) {
          bonusMatches++;
        }
      });
      // Add up to 3 bonus points
      breakdown.profileMatch = Math.min(15, breakdown.profileMatch + Math.round(bonusMatches * 0.5));
    }
  }

  // Calculate total score with purpose multiplier
  let totalScore = Math.round(
    (breakdown.location + breakdown.budget + breakdown.propertyType + 
     breakdown.amenities + breakdown.profileMatch) * purposeMultiplier
  );
  
  totalScore = Math.min(100, Math.max(0, totalScore));

  return {
    totalScore,
    breakdown,
    matchReason: generateMatchReason(breakdown, preferences)
  };
};

/**
 * Generate a human-readable match reason
 */
const generateMatchReason = (breakdown, preferences) => {
  const reasons = [];
  
  if (breakdown.location >= 25) {
    reasons.push(`Great location match for ${preferences.preferredLocation}`);
  }
  if (breakdown.budget >= 20) {
    reasons.push("Within your budget");
  }
  if (breakdown.propertyType >= 12) {
    reasons.push(`Perfect ${preferences.propertyType} match`);
  }
  if (breakdown.amenities >= 12) {
    reasons.push("Has most amenities you need");
  }
  if (breakdown.profileMatch >= 12) {
    reasons.push(`Ideal for ${preferences.userProfile}s`);
  }
  
  if (reasons.length === 0) {
    if (breakdown.location >= 15) reasons.push("Nearby location");
    else if (breakdown.budget >= 10) reasons.push("Budget-friendly option");
    else reasons.push("Alternative option");
  }
  
  return reasons.slice(0, 2).join(" • ");
};

/**
 * Get AI suggestions categorized by different criteria
 */
const getAISuggestions = (scoredProperties) => {
  // Sort by total score for top matches
  const topMatches = [...scoredProperties]
    .sort((a, b) => b.aiScore.totalScore - a.aiScore.totalScore)
    .slice(0, 5);

  // Budget-friendly: best score among lower-priced options
  const budgetFriendly = [...scoredProperties]
    .sort((a, b) => {
      // Prioritize lower price with decent score
      const scoreA = a.aiScore.totalScore - (a.price / 10000);
      const scoreB = b.aiScore.totalScore - (b.price / 10000);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  // Closest properties: best location scores
  const closest = [...scoredProperties]
    .sort((a, b) => b.aiScore.breakdown.location - a.aiScore.breakdown.location)
    .slice(0, 5);

  return {
    topMatches,
    budgetFriendly,
    closest
  };
};

module.exports = {
  calculateAIMatchScore,
  getAISuggestions,
  calculateDistance,
  LOCATION_COORDS
};
