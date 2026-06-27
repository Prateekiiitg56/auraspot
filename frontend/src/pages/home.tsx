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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/properties`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setProperties(data);
        } else {
          console.error("API response is not an array:", data);
          setProperties([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching properties:", err);
        setProperties([]);
        setLoading(false);
      });
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
        <p style={{ marginBottom: "28px" }}>
          Check out our latest listings
        </p>

        {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
            gap: "12px"
          }}>
            <div className="ai-loading-spinner" />
            <span style={{ color: "#94a3b8" }}>Loading properties...</span>
          </div>
        ) : properties.length === 0 ? (
          <div style={{
            padding: "60px 40px",
            textAlign: "center",
            background: "linear-gradient(135deg, var(--card-bg-start) 0%, var(--card-bg-end) 100%)",
            borderRadius: "16px",
            border: "1px solid var(--border-color)"
          }}>
            <p className="empty-text" style={{ marginTop: 0 }}>No properties found</p>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map(p => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
