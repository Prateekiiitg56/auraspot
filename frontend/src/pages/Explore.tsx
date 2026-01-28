import { useEffect, useState } from "react";
import { API } from "../services/api";
import PropertyCard from "../components/PropertyCard";
import { Link } from "react-router-dom";

type Property = {
  _id: string;
  title: string;
  price: number;
  city: string;
  area: string;
  type: string;
  purpose: string;
  image?: string;
};

const Explore = () => {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetch(`${API}/properties`)
      .then(res => res.json())
      .then(setProperties);
  }, []);

  const Section = ({ title, list }: { title: string; list: Property[] }) => {
    if (list.length === 0) return null;

    return (
      <div style={{ marginBottom: 50 }}>
        <h2 style={{ marginBottom: "8px" }}>{title}</h2>
        <p style={{ color: "#94a3b8", marginBottom: "28px", fontSize: "15px" }}>
          {list.length} available
        </p>

        <div className="property-grid">
          {list.slice(0, 6).map(p => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div style={{
        marginBottom: "48px",
        paddingBottom: "32px",
        borderBottom: "1px solid rgba(226, 232, 240, 0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start"
      }}>
        <div>
          <h1 style={{
            fontSize: "40px",
            marginBottom: "8px"
          }}>
            Explore Properties
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "16px" }}>
            Discover properties from across the country
          </p>
        </div>
        <Link to="/add">
          <button style={{
            whiteSpace: "nowrap"
          }}>➕ Add Property</button>
        </Link>
      </div>

      <Section
        title="🏠 PG & Hostels"
        list={properties.filter(
          p => p.type === "PG" || p.type === "HOSTEL"
        )}
      />

      <Section
        title="🏢 Flats"
        list={properties.filter(p => p.type === "FLAT")}
      />

      <Section
        title="🏡 Homes"
        list={properties.filter(p => p.type === "HOME")}
      />

      <Section
        title="💼 For Rent"
        list={properties.filter(p => p.purpose === "RENT")}
      />

      <Section
        title="💰 For Sale"
        list={properties.filter(p => p.purpose === "SALE")}
      />

      {properties.length === 0 && (
        <div style={{
          padding: "80px 40px",
          textAlign: "center",
          background: "linear-gradient(135deg, #1e293b 0%, #2d3748 100%)",
          borderRadius: "16px",
          border: "1px solid rgba(226, 232, 240, 0.1)"
        }}>
          <p style={{ fontSize: "18px", color: "#cbd5e1", marginBottom: "20px" }}>No properties found</p>
          <Link to="/add" style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600"
          }}>
            Add First Property
          </Link>
        </div>
      )}
    </div>
  );
};

export default Explore;
