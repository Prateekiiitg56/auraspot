import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  image?: string;
  images?: string[];
  propertyScore?: number;
  aiInsights?: {
    score?: number;
    priceRating?: string;
    locationQuality?: string;
    fraudRisk?: string;
  };
};

const CITIES = ["All Cities", "Guwahati", "Bangalore", "Delhi", "Mumbai"];

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States initialized from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "All Cities");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "ALL");
  const [selectedPurpose, setSelectedPurpose] = useState(searchParams.get("purpose") || "ALL");
  const [maxPrice, setMaxPrice] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/properties`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProperties(data);
        } else {
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

  // Update URL search parameters when filters change
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "ALL" && value !== "All Cities") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Filtered properties based on user inputs
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Area / Locality Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesArea = p.area?.toLowerCase().includes(query);
        const matchesCity = p.city?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesArea && !matchesCity) return false;
      }

      // City Filter
      if (selectedCity !== "All Cities" && p.city?.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Type Filter
      if (selectedType !== "ALL") {
        if (selectedType === "PG" && p.type !== "PG" && p.type !== "HOSTEL") return false;
        if (selectedType !== "PG" && p.type !== selectedType) return false;
      }

      // Purpose Filter
      if (selectedPurpose !== "ALL" && p.purpose !== selectedPurpose) {
        return false;
      }

      // Max Price Filter
      if (maxPrice && p.price > Number(maxPrice)) {
        return false;
      }

      return true;
    });
  }, [properties, searchQuery, selectedCity, selectedType, selectedPurpose, maxPrice]);

  return (
    <div className="wrap" style={{ padding: "40px 32px" }}>
      {/* Page Header with Add Property CTA */}
      <div style={{
        marginBottom: "32px",
        paddingBottom: "20px",
        borderBottom: "1px solid var(--paper-line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div className="mono" style={{ fontSize: "11px", color: "var(--blueprint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Real Estate Area Explorer
          </div>
          <h1 style={{ fontSize: "32px", margin: "4px 0 6px" }}>
            Explore Verified Property Listings
          </h1>
          <p style={{ fontSize: "15px", color: "var(--ink-soft)", margin: 0 }}>
            Filter properties by locality, price, and property type with live AuraScore risk audits.
          </p>
        </div>

        {/* Upload Own Property CTA */}
        <button
          className="btn btn-blueprint"
          onClick={() => navigate("/add-property")}
          style={{ padding: "10px 20px" }}
        >
          ➕ Post Your Property
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="paper-card" style={{ padding: "20px", marginBottom: "32px" }}>
        {/* Search Input Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "4px", display: "block" }}>
              Search Locality / Area
            </label>
            <input
              type="text"
              placeholder="e.g. Uzan Bazar, Beltola, Indiranagar..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleFilterChange("search", e.target.value);
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "4px", display: "block" }}>
              Property Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                handleFilterChange("type", e.target.value);
              }}
            >
              <option value="ALL">All Types</option>
              <option value="FLAT">Flats</option>
              <option value="PG">PG / Hostel</option>
              <option value="HOME">Houses</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "4px", display: "block" }}>
              Purpose
            </label>
            <select
              value={selectedPurpose}
              onChange={(e) => {
                setSelectedPurpose(e.target.value);
                handleFilterChange("purpose", e.target.value);
              }}
            >
              <option value="ALL">All Purposes</option>
              <option value="RENT">For Rent</option>
              <option value="SALE">For Sale</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "4px", display: "block" }}>
              Max Budget (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 25000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* City Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink-soft)", marginRight: "4px" }}>
            City:
          </span>
          {CITIES.map((city) => {
            const active = selectedCity.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                className="tag"
                style={{
                  cursor: "pointer",
                  padding: "5px 12px",
                  fontSize: "12px",
                  background: active ? "var(--blueprint)" : "var(--paper)",
                  color: active ? "#FFFFFF" : "var(--ink)",
                  borderColor: active ? "var(--blueprint)" : "var(--paper-line)"
                }}
                onClick={() => {
                  setSelectedCity(city);
                  handleFilterChange("city", city);
                }}
              >
                📍 {city}
              </button>
            );
          })}

          {(searchQuery || selectedType !== "ALL" || selectedPurpose !== "ALL" || selectedCity !== "All Cities" || maxPrice) && (
            <button
              type="button"
              className="btn btn-paper"
              style={{ padding: "4px 10px", fontSize: "12px", marginLeft: "auto" }}
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("All Cities");
                setSelectedType("ALL");
                setSelectedPurpose("ALL");
                setMaxPrice("");
                setSearchParams(new URLSearchParams());
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Property Results List Grid */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
          <div className="ai-loading-spinner" />
          <span className="mono" style={{ color: "var(--ink-soft)" }}>Loading area properties...</span>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="paper-card" style={{ padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
          <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>No Matching Properties Found</h3>
          <p style={{ color: "var(--ink-soft)", maxWidth: "440px", margin: "0 auto 24px", fontSize: "14px" }}>
            Try expanding your search query or reset your locality filters. Alternatively, upload your own property to list it live on AuraSpot.
          </p>
          <button className="btn btn-blueprint" onClick={() => navigate("/add-property")}>
            ➕ Upload Your Property Listing
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div className="mono" style={{ fontSize: "13px", color: "var(--ink-soft)", fontWeight: 600 }}>
              Showing {filteredProperties.length} verified listings
            </div>
          </div>

          <div className="property-grid">
            {filteredProperties.map((p) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
