import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API, getImageUrl } from "../services/api";
import PropertyCard from "../components/PropertyCard";
import VerificationStamp from "../components/VerificationStamp";
import SurveyGrade from "../components/SurveyGrade";

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
};

const AUTOCOMPLETE_LOCATIONS = [
  "Uzan Bazar, Guwahati",
  "Beltola, Guwahati",
  "Zoo Road, Guwahati",
  "Indiranagar, Bangalore",
  "Koramangala, Bangalore",
  "South Delhi"
];

// Mock items for the browser mockup window
const MOCK_LISTINGS = [
  {
    name: "Riverside Flat",
    place: "Uzan Bazar",
    score: 87,
    badgeType: "badge-hi",
    price: "₹18,500",
    status: "available",
    fraudRisk: "Low",
    priceRating: "Fair",
    suggestedRent: "₹18.2k",
    bullets: [
      "Owner verified with government ID, 12 deals closed.",
      "Rent is within 4% of what similar flats nearby go for.",
      "Balcony, covered parking, and water supply confirmed on-site."
    ]
  },
  {
    name: "Sunrise PG",
    place: "Zoo Road",
    score: 91,
    badgeType: "badge-hi",
    price: "₹7,200",
    status: "available",
    fraudRisk: "Very Low",
    priceRating: "Great Deal",
    suggestedRent: "₹7.5k",
    bullets: [
      "24/7 Power backup & high-speed Wi-Fi included.",
      "Verified student & working professional community.",
      "Daily housekeeping and home-style meals served."
    ]
  },
  {
    name: "Green Meadows Home",
    place: "Beltola",
    score: 64,
    badgeType: "badge-mid",
    price: "₹32,000",
    status: "pending review",
    fraudRisk: "Moderate",
    priceRating: "Slightly High",
    suggestedRent: "₹28.5k",
    bullets: [
      "Spacious 3BHK bungalow with private garden.",
      "Rent requested is 12% above market average for Beltola.",
      "Property history under verification by AuraSpot team."
    ]
  },
  {
    name: "Hilltop Hostel",
    place: "Basistha",
    score: 78,
    badgeType: "badge-hi",
    price: "₹5,400",
    status: "available",
    fraudRisk: "Low",
    priceRating: "Fair",
    suggestedRent: "₹5.4k",
    bullets: [
      "Scenic mountain view rooms for students.",
      "Strict security with biometric entry.",
      "Proximity to major institutions & bus routes."
    ]
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Autocomplete State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("ALL");
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMock, setSelectedMock] = useState(MOCK_LISTINGS[0]);

  // 3D Perspective Tilt State
  const [tiltStyle, setTiltStyle] = useState({ transform: "perspective(1200px) rotateX(0deg) rotateY(0deg)" });

  const handleMouseMove3D = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTiltStyle({
      transform: `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    });
  };

  const handleMouseLeave3D = () => {
    setTiltStyle({
      transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
    });
  };

  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Filter autocomplete suggestions based on query
  const filteredSuggestions = AUTOCOMPLETE_LOCATIONS.filter(loc =>
    loc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setAutocompleteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}&type=${searchType}`);
    }, 400);
  };

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
    <div>
      {/* 1. HERO SECTION (Asymmetric & Product-Driven) */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            {/* Left Column: Specific Copy & Product Control */}
            <div>
              <div className="eyebrow">
                AI Property Scoring & Fraud Audit
              </div>
              <h1>
                Check the math on a home before you sign the lease
              </h1>
              <p className="sub">
                Skip fake photos, hidden broker cuts, and WhatsApp forwards. <b>AuraSpot</b> runs owner verification, market rent variance, and location risk before you visit.
              </p>

              {/* Product Control Search Bar with Real Autocomplete */}
              <form onSubmit={handleSearchSubmit}>
                <div className="search-box-container" ref={searchBoxRef}>
                  <span style={{ fontSize: "14px", color: "var(--color-text-caption)" }}>🔍</span>
                  <input
                    className="search-input-field"
                    type="text"
                    placeholder="Enter locality or city (e.g. Uzan Bazar)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setAutocompleteOpen(true);
                    }}
                    onFocus={() => setAutocompleteOpen(true)}
                  />
                  <select
                    className="search-type-select"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                  >
                    <option value="ALL">All Types</option>
                    <option value="FLAT">Flats</option>
                    <option value="PG">PG / Hostel</option>
                    <option value="HOME">Houses</option>
                  </select>
                  <button type="submit" className="hero-search-btn" disabled={isSearching}>
                    {isSearching ? (
                      <span className="ai-loading-spinner" style={{ width: "16px", height: "16px" }} />
                    ) : (
                      "Analyze"
                    )}
                  </button>

                  {/* Autocomplete Dropdown */}
                  {autocompleteOpen && filteredSuggestions.length > 0 && (
                    <div className="search-autocomplete">
                      <div style={{
                        padding: "6px 12px",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        color: "var(--color-text-caption)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>
                        Popular Locations
                      </div>
                      {filteredSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="autocomplete-item"
                          onClick={() => {
                            setSearchQuery(item);
                            setAutocompleteOpen(false);
                          }}
                        >
                          <span>📍 {item}</span>
                          <span style={{ fontSize: "11px", color: "var(--color-text-caption)" }}>Verified</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </form>

              {/* Credible Single Trust Signal */}
              <div className="trust-signal-bar">
                <span>100% of listings scored across 5 risk signals before going live:</span>
                <span className="trust-signal-chip">🛡️ Owner ID</span>
                <span className="trust-signal-chip">📊 Rent Variance</span>
                <span className="trust-signal-chip">⚡ 0% Broker Fee</span>
              </div>
            </div>

            {/* Right Column: Interactive 3D Perspective Tilt Card Stack */}
            <div
              className="hero-card-stack-3d"
              onMouseMove={handleMouseMove3D}
              onMouseLeave={handleMouseLeave3D}
              style={{
                ...tiltStyle,
                transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              {/* Photo Preview Card with 3D Depth */}
              <div className="card-3d-tilt card-sheen">
                <div style={{ position: "relative" }}>
                  <img
                    src={properties.length > 0 && properties[0].images?.[0] 
                      ? getImageUrl(properties[0].images[0])
                      : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"}
                    alt="AuraSpot Property Verification"
                    className="photo-preview-img"
                  />
                  <div className="stamp-3d-floating" style={{ position: "absolute", top: "14px", right: "14px", zIndex: 10 }}>
                    <VerificationStamp size="md" rotation={-6} />
                  </div>
                </div>

                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--paper-subtle)" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 650, fontFamily: "var(--font-serif)", color: "var(--ink)" }}>Riverside Flat 2BHK</div>
                    <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Uzan Bazar, Guwahati</div>
                  </div>
                  <div className="mono" style={{ fontSize: "17px", fontWeight: 700, color: "var(--blueprint)" }}>
                    ₹18,500/mo
                  </div>
                </div>
              </div>

              {/* Elevated 3D Inspection Survey Grade Note */}
              <div style={{ transform: "translateZ(25px)" }}>
                <SurveyGrade score={87} gradeLabel="GRADE A · VERIFIED LOW RISK" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ASYMMETRICAL FEATURE BENTO GRID */}
      <section className="feature">
        <div className="wrap">
          <h2>How AuraSpot protects your deposit</h2>
          <p className="feature-subhead">
            Every property is audited against 5 data sources before you pay a single rupee or schedule a visit.
          </p>

          <div className="feature-bento-grid">
            {/* Hero Bento Card (AI Property Score - 65% Span) */}
            <div className="bento-hero-card">
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Core Differentiator</span>
                  <span className="mono" style={{ fontSize: "11px", color: "var(--color-text-caption)" }}>Live Inspection Engine v2.4</span>
                </div>
                <div className="bento-card-title">AI-Powered Risk & Value Audit</div>
                <div className="bento-card-desc">
                  Calculates 5 independent data points to protect you from overpriced leases. We analyze historical rent trends, owner ID credentials, and neighborhood amenities before listing.
                </div>
              </div>

              {/* Embedded Live Score Breakdown Preview */}
              <div style={{
                marginTop: "24px",
                background: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div className="score-ring" style={{ margin: 0 }}>
                    <div className="score-ring-inner">
                      <div className="num">87</div>
                      <div className="lbl">Aura Score</div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="factor-bar-item" style={{ marginBottom: "6px" }}>
                      <span>Price Fairness (25%)</span>
                      <span className="mono" style={{ color: "var(--color-success)", fontWeight: 600 }}>Fair</span>
                    </div>
                    <div className="factor-bar-item" style={{ marginBottom: "6px" }}>
                      <span>Owner Credibility (15%)</span>
                      <span className="mono" style={{ color: "var(--color-success)", fontWeight: 600 }}>Verified ID</span>
                    </div>
                    <div className="factor-bar-item">
                      <span>Location Security (25%)</span>
                      <span className="mono" style={{ color: "var(--color-primary)", fontWeight: 600 }}>High Demand</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Column: 2 Focused Functional Feature Cards */}
            <div className="bento-side-column">
              {/* Feature Card 2: Verified Owners */}
              <div className="bento-side-card">
                <div>
                  <div className="bento-card-header">
                    <span style={{ fontSize: "18px" }}>🛡️</span>
                    <span className="tag tag-green">Government ID Verified</span>
                  </div>
                  <div className="bento-card-title" style={{ fontSize: "17px" }}>Verified Landlords Only</div>
                  <div className="bento-card-desc" style={{ fontSize: "13px" }}>
                    Zero anonymous posts. Every landlord uploads government ID & property ownership proof before receiving inquiries.
                  </div>
                </div>

                <div style={{
                  marginTop: "16px",
                  padding: "10px 12px",
                  background: "var(--color-success-bg)",
                  border: "1px solid var(--color-success-border)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px"
                }}>
                  <span style={{ color: "var(--color-success)", fontWeight: 600 }}>✓ Land Title & ID Matched</span>
                  <span className="mono" style={{ fontSize: "11px", color: "var(--color-success)" }}>12 Deals Closed</span>
                </div>
              </div>

              {/* Feature Card 3: Fair Market Rent Variance */}
              <div className="bento-side-card">
                <div>
                  <div className="bento-card-header">
                    <span style={{ fontSize: "18px" }}>📊</span>
                    <span className="tag tag-amber">Market Rent Delta</span>
                  </div>
                  <div className="bento-card-title" style={{ fontSize: "17px" }}>Fair Market Valuation</div>
                  <div className="bento-card-desc" style={{ fontSize: "13px" }}>
                    Know what neighboring flats actually rent for. AuraSpot flags listings priced &gt;10% above market average.
                  </div>
                </div>

                <div style={{
                  marginTop: "16px",
                  padding: "10px 12px",
                  background: "var(--color-bg-subtle)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px"
                }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Listed: ₹18,500</span>
                  <span className="mono" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Est: ₹18,200 (-1.6%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Browser Window Mockup */}
          <div className="mock-window">
            <div className="mock-bar">
              <span className="mock-dot"></span>
              <span className="mock-dot"></span>
              <span className="mock-dot"></span>
              <span className="path">auraspot.app/explore/guwahati/flats</span>
            </div>
            <div className="mock-body">
              {/* Left Pane - Listings */}
              <div className="mock-list">
                <div className="mock-list-head">Flats in Guwahati</div>
                {MOCK_LISTINGS.map((item, idx) => (
                  <div
                    key={idx}
                    className={`mock-row ${selectedMock.name === item.name ? "active" : ""}`}
                    onClick={() => setSelectedMock(item)}
                  >
                    <div>
                      <span className="name">{item.name}</span>
                      <span className="place">{item.place}</span>
                    </div>
                    <span className={`badge-sm ${item.badgeType}`}>{item.score}</span>
                    <span className="price">{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Right Pane - AI Insights Detail */}
              <div className="mock-detail">
                <div className="head">
                  <span className="t">{selectedMock.name}</span>
                  <span className="status">{selectedMock.status}</span>
                </div>
                <div className="insight-grid">
                  <div className="insight-box">
                    <div className="l">Score</div>
                    <div className="v">{selectedMock.score} / 100</div>
                  </div>
                  <div className="insight-box">
                    <div className="l">Fraud risk</div>
                    <div className="v">{selectedMock.fraudRisk}</div>
                  </div>
                  <div className="insight-box">
                    <div className="l">Price rating</div>
                    <div className="v">{selectedMock.priceRating}</div>
                  </div>
                  <div className="insight-box">
                    <div className="l">Suggested rent</div>
                    <div className="v">{selectedMock.suggestedRent}</div>
                  </div>
                </div>
                <div className="desc">
                  <ul>
                    {selectedMock.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                <div className="sketch">
                  <div className="note">how the {selectedMock.score} score is calculated —</div>
                  <div className="factors">
                    <span className="factor-chip">location 25%</span>
                    <span className="factor-chip">price 25%</span>
                    <span className="factor-chip">amenities 20%</span>
                    <span className="factor-chip">demand 15%</span>
                    <span className="factor-chip">owner 15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. REAL FEATURED PROPERTIES FROM API */}
      <section style={{ padding: "20px 0 80px" }}>
        <div className="wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px" }}>
            <div>
              <h2 style={{ marginBottom: "6px" }}>Featured Properties</h2>
              <p style={{ color: "var(--color-text-muted)" }}>Explore verified live listings scored by AuraSpot AI</p>
            </div>
            <button
              className="btn btn-outline"
              onClick={() => navigate("/explore")}
            >
              View all listings →
            </button>
          </div>

          {loading ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 0",
              gap: "12px"
            }}>
              <div className="ai-loading-spinner" />
              <span className="mono" style={{ color: "var(--color-text-muted)" }}>Loading properties...</span>
            </div>
          ) : properties.length === 0 ? (
            <div className="card" style={{
              padding: "60px 40px",
              textAlign: "center"
            }}>
              <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No properties found</p>
            </div>
          ) : (
            <div className="property-grid">
              {properties.map(p => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
