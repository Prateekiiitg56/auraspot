import { useNavigate } from "react-router-dom";
import { memo } from "react";
import { getImageUrl } from "../services/api";
import VerificationStamp from "./VerificationStamp";

interface PropertyCardProps {
  property: {
    _id: string;
    title: string;
    price: number;
    city?: string;
    area?: string;
    type: string;
    purpose: string;
    image?: string;
    images?: string[];
    propertyScore?: number;
    scoreDescription?: string;
    owner?: {
      trustBadge?: string;
      dealsClosed?: number;
    };
    aiInsights?: {
      score?: number;
      priceRating?: string;
      locationQuality?: string;
      fraudRisk?: string;
      summary?: string;
    };
  };
}

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80";

const PropertyCard = memo(({ property }: PropertyCardProps) => {
  const navigate = useNavigate();

  const score = property.aiInsights?.score || property.propertyScore || 87;
  const fraudRisk = property.aiInsights?.fraudRisk || "Low Risk";
  const priceRating = property.aiInsights?.priceRating || "Fair Market Price";

  const displayImage = (property.images && property.images.length > 0)
    ? getImageUrl(property.images[0])
    : property.image
      ? getImageUrl(property.image)
      : FALLBACK_PHOTO;

  const imageCount = property.images?.length || 1;
  const cityArea = [property.area, property.city || "Guwahati"].filter(Boolean).join(", ");

  return (
    <div
      className="paper-card deckle-edge property-card"
      onClick={() => navigate(`/property/${property._id}`)}
      style={{ padding: 0 }}
    >
      {/* 1. Header Stamp & Photo Container */}
      <div className="property-img-container">
        <img
          src={displayImage}
          className="property-img"
          alt={`${property.title} - ${property.type} in ${property.city || "Guwahati"}`}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_PHOTO;
          }}
        />

        {/* Verification Stamp Badge Overlay */}
        <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 6 }}>
          <VerificationStamp size="sm" rotation={-4} />
        </div>

        {/* Photo Count Badge */}
        {imageCount > 1 && (
          <div className="mono" style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            background: "rgba(20, 22, 27, 0.75)",
            backdropFilter: "blur(6px)",
            color: "#FFFFFF",
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            fontSize: "11px",
            fontWeight: "500",
            zIndex: 5
          }}>
            📷 {imageCount}
          </div>
        )}
      </div>

      {/* 2. Card Body with Survey Grade & Consolidated Spec */}
      <div className="card-body" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
            <h3 style={{ fontSize: "17px", margin: 0, fontFamily: "var(--font-serif)" }}>{property.title}</h3>
            <span className="mono" style={{ fontSize: "18px", fontWeight: 700, color: "var(--blueprint)" }}>
              {score}
            </span>
          </div>

          <div className="property-spec-line" style={{ fontSize: "12.5px", color: "var(--ink-soft)", marginBottom: "8px" }}>
            <span>{property.type}</span>
            <span>·</span>
            <span>{property.purpose === "RENT" ? "For Rent" : "For Sale"}</span>
            <span>·</span>
            <span>📍 {cityArea}</span>
          </div>

          <div className="price mono" style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", marginBottom: "10px" }}>
            ₹{property.price.toLocaleString()}
            {property.purpose === "RENT" ? "/mo" : ""}
          </div>
        </div>

        {/* Status Badges */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span className="tag" style={{ background: "var(--paper)", border: "1px solid var(--verified)", color: "var(--verified)", fontSize: "10.5px" }}>
            🛡️ {fraudRisk}
          </span>
          <span className="tag" style={{ background: "var(--paper)", border: "1px solid var(--flag)", color: "var(--flag)", fontSize: "10.5px" }}>
            💰 {priceRating}
          </span>
        </div>
      </div>

      {/* 3. Hover Reveal Drawer */}
      <div className="card-hover-drawer">
        <div className="hover-drawer-header">
          <span style={{ fontWeight: 600, color: "var(--verified)" }}>
            ✓ Verified Landlord
          </span>
          <span className="mono" style={{ color: "var(--ink-soft)" }}>
            ⭐ 4.9 (12 deals)
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--blueprint)", fontWeight: 600 }}>
          <span>View Survey Breakdown</span>
          <span>Quick Inspection →</span>
        </div>
      </div>
    </div>
  );
});

PropertyCard.displayName = "PropertyCard";

export default PropertyCard;
