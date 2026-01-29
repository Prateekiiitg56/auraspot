import { useNavigate } from "react-router-dom";

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
    propertyScore?: number;
    scoreDescription?: string;
    scoreBreakdown?: {
      location: number;
      priceFairness: number;
      amenities: number;
      demand: number;
      ownerCredibility: number;
    };
    owner?: {
      trustBadge?: string;
    };
  };
}

// Get score color based on value
const getScoreColor = (score: number) => {
  if (score >= 80) return "#10b981"; // Green - Excellent
  if (score >= 60) return "#3b82f6"; // Blue - Good
  if (score >= 40) return "#f59e0b"; // Yellow - Fair
  return "#ef4444"; // Red - Poor
};

// Get score label
const getScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Basic";
};

const PropertyCard = ({ property }: PropertyCardProps) => {
  const navigate = useNavigate();
  const score = property.propertyScore || 0;
  const scoreColor = getScoreColor(score);

  return (
    <div
      className="property-card"
      onClick={() => navigate(`/property/${property._id}`)}
      style={{ cursor: "pointer", position: "relative" }}
    >
      {/* Smart Property Score Badge */}
      {score > 0 && (
        <div style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: scoreColor,
          color: "white",
          padding: "6px 10px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 10
        }}>
          <span style={{ fontSize: "16px" }}>⭐</span>
          <span>{score}</span>
          <span style={{ fontSize: "10px", opacity: 0.9 }}>/100</span>
        </div>
      )}

      {/* Score Label Badge */}
      {score > 0 && (
        <div style={{
          position: "absolute",
          top: "52px",
          right: "12px",
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "3px 8px",
          borderRadius: "4px",
          fontSize: "10px",
          fontWeight: "500",
          zIndex: 10
        }}>
          {getScoreLabel(score)}
        </div>
      )}

      <img
        src={property.image ? `http://localhost:5000/uploads/${property.image}` : "https://via.placeholder.com/300x200?text=No+Image"}
        className="property-img"
      />

      <div className="card-body">
        <h3>{property.title}</h3>
        <p className="price">₹{property.price.toLocaleString()}</p>
        <p className="location">
          {property.city}{property.area ? `, ${property.area}` : ""}
        </p>
        
        {/* Score Description */}
        {property.scoreDescription && (
          <p style={{
            fontSize: "11px",
            color: scoreColor,
            marginTop: "6px",
            fontWeight: "500",
            textTransform: "capitalize"
          }}>
            {property.scoreDescription}
          </p>
        )}
        
        <span className="tag">
          {property.type} • {property.purpose}
        </span>
      </div>
    </div>
  );
};

export default PropertyCard;
