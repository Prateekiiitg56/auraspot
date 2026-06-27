import { useEffect, useState, memo } from "react";
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

// Memoized Section component - moved outside Explore to avoid re-creation on every render
const Section = memo(({ title, list }: { title: string; list: Property[] }) => {
  if (list.length === 0) return null;

  return (
    <div style={{ marginBottom: 50 }}>
      <h2 style={{ marginBottom: "8px" }}>{title}</h2>
      <p style={{ marginBottom: "28px", fontSize: "15px" }}>
        {list.length} available
      </p>

      <div className="property-grid">
        {list.slice(0, 6).map(p => (
          <PropertyCard key={p._id} property={p} />
        ))}
      </div>
    </div>
  );
});

Section.displayName = "Section";

const Explore = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
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

  // Pre-compute filtered lists once instead of filtering on each render
  const pgHostels = properties.filter(p => p.type === "PG" || p.type === "HOSTEL");
  const flats = properties.filter(p => p.type === "FLAT");
  const homes = properties.filter(p => p.type === "HOME");
  const forRent = properties.filter(p => p.purpose === "RENT");
  const forSale = properties.filter(p => p.purpose === "SALE");

  return (
    <div className="page">
      {/* Page Header */}
      <div style={{
        marginBottom: "48px",
        paddingBottom: "32px",
        borderBottom: "1px solid var(--border-color)",
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
          <p style={{ fontSize: "16px" }}>
            Discover properties from across the country
          </p>
        </div>
        <Link to="/add">
          <button style={{
            whiteSpace: "nowrap"
          }}>➕ Add Property</button>
        </Link>
      </div>

      {loading ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
          gap: "12px"
        }}>
          <div className="ai-loading-spinner" />
          <span style={{ color: "#94a3b8" }}>Loading properties...</span>
        </div>
      ) : (
        <>
          <Section title="🏠 PG & Hostels" list={pgHostels} />
          <Section title="🏢 Flats" list={flats} />
          <Section title="🏡 Homes" list={homes} />
          <Section title="💼 For Rent" list={forRent} />
          <Section title="💰 For Sale" list={forSale} />

          {properties.length === 0 && (
            <div style={{
              padding: "80px 40px",
              textAlign: "center",
              background: "linear-gradient(135deg, var(--card-bg-start) 0%, var(--card-bg-end) 100%)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)"
            }}>
              <p style={{ fontSize: "18px", marginBottom: "20px" }}>No properties found</p>
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
        </>
      )}
    </div>
  );
};

export default Explore;
