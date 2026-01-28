import { useNavigate } from "react-router-dom";

const PropertyCard = ({ property }: { property: any }) => {
  const navigate = useNavigate();

  return (
    <div
      className="property-card"
      onClick={() => navigate(`/property/${property._id}`)}
      style={{ cursor: "pointer" }}
    >
      <img
        src={`http://localhost:5000/uploads/${property.image}`}
        className="property-img"
      />

      <div className="card-body">
        <h3>{property.title}</h3>
        <p className="price">₹{property.price.toLocaleString()}</p>
        <p className="location">
          {property.city}, {property.area}
        </p>
        <span className="tag">
          {property.type} • {property.purpose}
        </span>
      </div>
    </div>
  );
};

export default PropertyCard;
