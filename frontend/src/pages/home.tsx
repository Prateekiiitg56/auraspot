import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../services/api";
import PropertyCard from "../components/PropertyCard";

type Property = {
  _id: string;
  title: string;
  price: number;
  city: string;
  area: string;
  type: string;
  purpose: string;
};

const Home = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetch(`${API}/properties`)
      .then(res => res.json())
      .then(data => setProperties(data))
      .catch(err => console.error("Failed to fetch properties", err));
  }, []);

  return (
    <div className="page">
      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)",
        borderRadius: "20px",
        padding: "80px 40px",
        textAlign: "center",
        marginBottom: "60px",
        border: "1px solid rgba(102, 126, 234, 0.2)",
        backdropFilter: "blur(8px)"
      }}>
        <h1 style={{
          fontSize: "48px",
          marginBottom: "16px",
          fontWeight: 800,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Find Your Perfect Property
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#cbd5e1",
          marginBottom: "32px",
          maxWidth: "600px",
          margin: "0 auto 32px"
        }}>
          Discover amazing properties, connect with owners, and make your dream home a reality.
        </p>
        <button
          onClick={() => navigate("/explore")}
          style={{
            padding: "14px 40px",
            fontSize: "16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            boxShadow: "0 12px 30px rgba(102, 126, 234, 0.4)"
          }}
        >
          Explore Properties →
        </button>
      </div>

      {/* Featured Properties */}
      <div>
        <h2 style={{ marginBottom: "8px" }}>Featured Properties</h2>
        <p style={{ color: "#94a3b8", marginBottom: "28px" }}>
          Check out our latest listings
        </p>

        {properties.length === 0 && (
          <div style={{
            padding: "60px 40px",
            textAlign: "center",
            background: "linear-gradient(135deg, #1e293b 0%, #2d3748 100%)",
            borderRadius: "16px",
            border: "1px solid rgba(226, 232, 240, 0.1)"
          }}>
            <p className="empty-text" style={{ marginTop: 0 }}>No properties found</p>
          </div>
        )}

        <div className="property-grid">
          {properties.map(p => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
