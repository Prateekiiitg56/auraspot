import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "../services/api";
import { auth } from "../services/firebase";

type Owner = {
  _id: string;
  name: string;
  email: string;
};

type Property = {
  _id: string;
  title: string;
  price: number;
  city: string;
  area: string;
  type: string;
  purpose: string;
  description: string;
  amenities: string[];
  latitude: number;
  longitude: number;
  image: string;
  status: string;
  owner?: Owner;
  assignedTo?: Owner;
};

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const currentUser = auth.currentUser;

  const loadProperty = async () => {
    try {
      const res = await fetch(`${API}/properties/${id}`);
      const data = await res.json();
      setProperty(data);
    } catch (err) {
      console.error("Failed loading property", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperty();
  }, [id]);

  if (loading) return <div className="page">Loading property...</div>;
  if (!property) return <div className="page">Property not found</div>;

  const isOwner =
    currentUser?.email &&
    property.owner?.email &&
    currentUser.email === property.owner.email;

const isUnavailable = property.status !== "AVAILABLE";

// Chat is available for:
// 1. Owner and assigned user when property is BOOKED/SOLD
// 2. Any logged-in user who is not the owner (to contact owner)
const canChat = currentUser && !isOwner;


  /* ================= DELETE ================= */

  const deleteProperty = async () => {
    if (!window.confirm("Delete this property?")) return;

    await fetch(`${API}/properties/${property._id}`, {
      method: "DELETE"
    });

    navigate("/explore");
  };

  /* ================= RESET PROPERTY (DEBUG) ================= */

  const resetProperty = async () => {
    try {
      const res = await fetch(`${API}/properties/${property._id}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error("Reset failed");

      alert("Property reset to AVAILABLE!");
      await loadProperty();
    } catch (err) {
      console.error("Reset error:", err);
      alert("Failed to reset property");
    }
  };

  /* ================= SEND REQUEST ================= */

  const sendRequest = async () => {
    if (!currentUser) return alert("Please login first");

    if (!property.owner?._id) return alert("Owner info missing");

    if (!message.trim()) return alert("Please write a message");

    if (isUnavailable) return alert("Property already booked");

    try {
      // Send request via property endpoint (updates property status + creates notification)
      const res = await fetch(`${API}/properties/${property._id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          message
        })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Request failed with status:", res.status, error);
        throw new Error(error.message || "Request failed");
      }

      alert("Request sent to owner!");
      setMessage("");
      
      // Reload property to get updated status
      await loadProperty();
    } catch (err) {
      console.error("Send request error:", err);
      alert(`Failed to send request: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="page details-page" style={{ paddingBottom: "60px" }}>
      {/* Image Section */}
      {property.image && (
        <div style={{
          maxWidth: "900px",
          margin: "0 auto 40px",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(102, 126, 234, 0.2)",
          boxShadow: "0 20px 40px rgba(102, 126, 234, 0.15)"
        }}>
          <img
            src={`http://localhost:5000/uploads/${property.image}`}
            className="details-img"
            alt={property.title}
            style={{
              width: "100%",
              height: "400px",
              objectFit: "cover",
              display: "block"
            }}
          />
        </div>
      )}

      {/* Header Section */}
      <div style={{
        maxWidth: "900px",
        margin: "0 auto 40px",
        paddingBottom: "32px",
        borderBottom: "1px solid rgba(226, 232, 240, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "12px" }}>
          <h1 style={{
            fontSize: "40px",
            margin: "0",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: "1.2"
          }}>
            {property.title}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", color: "#94a3b8", marginBottom: "16px" }}>
          <span style={{ fontSize: "16px" }}>📍 {property.city}, {property.area}</span>
          <span style={{ fontSize: "16px" }}>🏷️ {property.type} • {property.purpose}</span>
        </div>

        {/* Price and Status */}
        <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
          <p style={{
            fontSize: "32px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0"
          }}>
            ₹{property.price.toLocaleString()}
          </p>
          {isUnavailable && (
            <span style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              borderRadius: "8px",
              color: "#fca5a5",
              fontWeight: "600",
              fontSize: "14px"
            }}>
              ❌ {property.status}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Description */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "16px", color: "#f1f5f9" }}>📝 Description</h2>
          <p style={{ color: "#cbd5e1", lineHeight: "1.8", fontSize: "16px" }}>
            {property.description}
          </p>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "16px", color: "#f1f5f9" }}>✨ Amenities</h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px"
            }}>
              {property.amenities.map((a, i) => (
                <div key={i} style={{
                  padding: "12px 16px",
                  background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
                  border: "1px solid rgba(102, 126, 234, 0.2)",
                  borderRadius: "8px",
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{ color: "#667eea" }}>✓</span> {a}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "16px", color: "#f1f5f9" }}>📍 Location</h2>
          <div style={{
            padding: "20px",
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(45, 55, 72, 0.8) 100%)",
            border: "1px solid rgba(102, 126, 234, 0.2)",
            borderRadius: "12px",
            color: "#cbd5e1"
          }}>
            <p style={{ margin: "8px 0" }}>📐 Latitude: <span style={{ color: "#667eea", fontWeight: "600" }}>{property.latitude}</span></p>
            <p style={{ margin: "8px 0" }}>📐 Longitude: <span style={{ color: "#667eea", fontWeight: "600" }}>{property.longitude}</span></p>
          </div>
        </div>

        {/* Owner Info */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "16px", color: "#f1f5f9" }}>👤 Listed By</h2>
          {property.owner ? (
            <div style={{
              padding: "24px",
              background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
              border: "1px solid rgba(102, 126, 234, 0.2)",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <p style={{ margin: "0 0 4px 0", color: "#f1f5f9", fontWeight: "700", fontSize: "16px" }}>
                  {property.owner.name}
                </p>
                <p style={{ margin: "0", color: "#94a3b8", fontSize: "14px" }}>
                  {property.owner.email}
                </p>
              </div>
              {!isOwner && (
                <Link 
                  to={`/user/${property.owner.email}`}
                  style={{
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: "none",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                  }}
                >
                  👤 View Profile
                </Link>
              )}
            </div>
          ) : (
            <p style={{ color: "#94a3b8" }}>Owner information unavailable</p>
          )}
        </div>

        {/* Request/Action Section */}
        {!isOwner && currentUser && !isUnavailable && (
          <div style={{ marginBottom: "48px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "16px", color: "#f1f5f9" }}>💬 Contact Owner</h2>
            <div style={{
              padding: "24px",
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(45, 55, 72, 0.8) 100%)",
              border: "1px solid rgba(102, 126, 234, 0.2)",
              borderRadius: "12px"
            }}>
              <textarea
                placeholder="Write a message to the owner..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(102, 126, 234, 0.3)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  outline: "none",
                  minHeight: "100px",
                  fontSize: "14px",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLTextAreaElement).style.borderColor = "#667eea";
                  (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "0 0 12px rgba(102, 126, 234, 0.3)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(102, 126, 234, 0.3)";
                  (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginBottom: "32px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {canChat && (
            <button
              onClick={() => navigate(`/chat/${property._id}`)}
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "14px 28px",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(59, 130, 246, 0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              💬 Chat
            </button>
          )}

          {isOwner && (
            <>
              <button
                onClick={deleteProperty}
                style={{
                  flex: "1",
                  minWidth: "200px",
                  padding: "14px 28px",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.8) 100%)",
                  color: "white",
                  border: "1px solid rgba(239, 68, 68, 0.5)",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(239, 68, 68, 0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                }}
              >
                🗑️ Delete Property
              </button>
              <button
                onClick={resetProperty}
                style={{
                  flex: "1",
                  minWidth: "200px",
                  padding: "14px 28px",
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.8) 0%, rgba(217, 119, 6, 0.8) 100%)",
                  color: "white",
                  border: "1px solid rgba(245, 158, 11, 0.5)",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(245, 158, 11, 0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                }}
              >
                ↻ Reset to Available
              </button>
            </>
          )}

          {!isOwner && currentUser && !isUnavailable && (
            <button
              onClick={sendRequest}
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "14px 28px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {property.purpose === "SALE" ? "🛒 Buy Property" : "🔑 Rent Property"}
            </button>
          )}
        </div>

        {isUnavailable && (
          <div style={{
            padding: "20px",
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "#fca5a5",
            textAlign: "center",
            fontWeight: "600"
          }}>
            This property is no longer available
          </div>
        )}

        {!currentUser && (
          <div style={{
            padding: "20px",
            background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
            border: "1px solid rgba(102, 126, 234, 0.3)",
            borderRadius: "8px",
            color: "#cbd5e1",
            textAlign: "center"
          }}>
            <p style={{ margin: "0" }}>Login to contact the owner</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetails;
