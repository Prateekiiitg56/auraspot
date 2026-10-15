import { Link } from "react-router-dom";
import { memo } from "react";
import { MapPin, Images, ShieldCheck, BadgeCheck } from "lucide-react";
import { formatINR, getPropertyImage, getImageUrl } from "../services/api";
import SaveButton from "./SaveButton";

export interface PropertyCardData {
  _id: string;
  title: string;
  price: number;
  city?: string;
  area?: string;
  type: string;
  purpose: string;
  status?: string;
  image?: string;
  images?: string[];
  bhk?: number;
  propertyScore?: number;
  owner?: {
    name?: string;
    verified?: boolean;
    trustBadge?: string;
  };
  aiInsights?: {
    score?: number;
    priceRating?: string;
    fraudRisk?: string;
  };
}

const TYPE_LABEL: Record<string, string> = {
  ROOM: "Room",
  PG: "PG",
  HOSTEL: "Hostel",
  FLAT: "Flat",
  HOME: "House"
};

const PRICE_LABEL: Record<string, string> = {
  EXCELLENT: "Great price",
  GOOD: "Good price",
  FAIR: "Fair price",
  ABOVE_AVERAGE: "Above market",
  OVERPRICED: "Overpriced",
  VERY_OVERPRICED: "Overpriced",
  SUSPICIOUS: "Unusually low"
};

const scoreTone = (score: number) => (score >= 75 ? "var(--verified)" : score >= 55 ? "var(--flag)" : "var(--brick)");

const PropertyCard = memo(({ property }: { property: PropertyCardData }) => {
  const score = property.aiInsights?.score || property.propertyScore || 0;
  const priceRating = property.aiInsights?.priceRating;
  const fraudRisk = property.aiInsights?.fraudRisk;
  const imageCount = property.images?.length || 0;
  const location = [property.area, property.city].filter(Boolean).join(", ");
  const typeLabel = TYPE_LABEL[property.type] || property.type;
  const unavailable = property.status === "BOOKED" || property.status === "SOLD";

  return (
    <article className="paper-card property-card" style={{ padding: 0 }}>
      <Link to={`/property/${property._id}`} className="property-card-link" aria-label={`${property.title}, ${formatINR(property.price)}`}>
        <div className="property-img-container">
          <img
            src={getPropertyImage(property)}
            className="property-img"
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = getImageUrl(null);
            }}
          />
          {imageCount > 1 && (
            <span className="img-chip mono">
              <Images size={12} aria-hidden="true" /> {imageCount}
            </span>
          )}
          {unavailable && <span className="img-chip img-chip-status">{property.status === "SOLD" ? "Sold" : "Rented"}</span>}
        </div>

        <div className="card-body">
          <div className="card-title-row">
            <h3>{property.title}</h3>
            {score > 0 && (
              <span className="card-score mono" style={{ color: scoreTone(score) }} title="AuraSpot score out of 100">
                {score}
              </span>
            )}
          </div>

          <p className="property-spec-line">
            {property.bhk ? `${property.bhk} BHK ${typeLabel}` : typeLabel} · {property.purpose === "RENT" ? "For rent" : "For sale"}
          </p>
          {location && (
            <p className="property-spec-line inline-icon">
              <MapPin size={13} aria-hidden="true" /> {location}
            </p>
          )}

          <div className="price mono card-price">
            {formatINR(property.price)}
            {property.purpose === "RENT" && <span className="card-price-unit">/month</span>}
          </div>

          <div className="card-tags">
            {property.owner?.verified && (
              <span className="tag tag-green inline-icon">
                <BadgeCheck size={12} aria-hidden="true" /> Verified owner
              </span>
            )}
            {fraudRisk === "LOW" && (
              <span className="tag tag-green inline-icon">
                <ShieldCheck size={12} aria-hidden="true" /> Low risk
              </span>
            )}
            {(fraudRisk === "MEDIUM" || fraudRisk === "HIGH") && (
              <span className="tag tag-amber">{fraudRisk === "HIGH" ? "High risk" : "Review carefully"}</span>
            )}
            {priceRating && PRICE_LABEL[priceRating] && <span className="tag">{PRICE_LABEL[priceRating]}</span>}
          </div>
        </div>
      </Link>
      <SaveButton propertyId={property._id} />
    </article>
  );
});

PropertyCard.displayName = "PropertyCard";

export default PropertyCard;
