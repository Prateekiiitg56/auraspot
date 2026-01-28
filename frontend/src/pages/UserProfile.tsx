import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { API } from "../services/api";

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  verified: boolean;
  role: string;
  bio?: string;
  socials?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  verificationDocuments?: Array<{
    type: string;
    documentNumber: string;
    uploadedAt: string;
  }>;
}

const UserProfile = () => {
  const { email } = useParams<{ email: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [email]);

  const loadUserProfile = async () => {
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/users/email/${email}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        alert("User not found");
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
      alert("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="page">
        <h2>User Not Found</h2>
        <p>This user's profile doesn't exist.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        background: darkMode ? "#1a1a2e" : "#e8e8e8",
        minHeight: "100vh",
        padding: "40px 20px",
        transition: "background 0.3s"
      }}
    >
      {/* Main Card Container */}
      <div
        style={{
          background: darkMode ? "#2d2d44" : "white",
          borderRadius: "12px",
          boxShadow: darkMode
            ? "0 4px 20px rgba(0,0,0,0.5)"
            : "0 4px 20px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}
      >
        {/* Top Section with Profile Image and Info */}
        <div
          style={{
            background: darkMode ? "#1e1e2f" : "#f5f5f5",
            padding: "50px 40px 30px",
            position: "relative"
          }}
        >
          {/* Dark Mode Toggle */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px"
            }}
          >
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: "8px 16px",
                background: darkMode ? "#3d3d5c" : "white",
                color: darkMode ? "white" : "#374151",
                border: darkMode ? "1px solid #555" : "1px solid #ddd",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
            {/* Profile Image */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "64px",
                  border: "5px solid white",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
                }}
              >
                👤
              </div>
              {user.verified && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    background: "#764ba2",
                    color: "white",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "700",
                    border: "3px solid white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                  }}
                >
                  ✓
                </div>
              )}
            </div>

            {/* Name and Info */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start"
                }}
              >
                <div>
                  <h1
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "32px",
                      color: darkMode ? "white" : "#1f2937",
                      fontWeight: "700"
                    }}
                  >
                    {user.name || "User"}
                  </h1>
                  <div
                    style={{
                      fontSize: "13px",
                      color: darkMode ? "#a0a0b8" : "#6b7280",
                      marginBottom: "12px"
                    }}
                  >
                    {user.email}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span
                      style={{
                        background: "#667eea",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}
                    >
                      {user.role === "OWNER" ? "🏠 Owner" : "👤 User"}
                    </span>
                    {user.verified && (
                      <span
                        style={{
                          background: "#22c55e",
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Social Icons */}
                <div style={{ display: "flex", gap: "10px" }}>
                  {user.socials?.facebook && (
                    <a
                      href={
                        user.socials.facebook.startsWith("http")
                          ? user.socials.facebook
                          : `https://facebook.com/${user.socials.facebook}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#3b5998",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "transform 0.2s, opacity 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.15)";
                        e.currentTarget.style.opacity = "0.8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      f
                    </a>
                  )}
                  {user.socials?.twitter && (
                    <a
                      href={
                        user.socials.twitter.startsWith("http")
                          ? user.socials.twitter
                          : `https://twitter.com/${user.socials.twitter}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#1da1f2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "transform 0.2s, opacity 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.15)";
                        e.currentTarget.style.opacity = "0.8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      𝕏
                    </a>
                  )}
                  {user.socials?.linkedin && (
                    <a
                      href={
                        user.socials.linkedin.startsWith("http")
                          ? user.socials.linkedin
                          : `https://linkedin.com/in/${user.socials.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#0077b5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "transform 0.2s, opacity 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.15)";
                        e.currentTarget.style.opacity = "0.8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      in
                    </a>
                  )}
                  {user.socials?.instagram && (
                    <a
                      href={
                        user.socials.instagram.startsWith("http")
                          ? user.socials.instagram
                          : `https://instagram.com/${user.socials.instagram}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background:
                          "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "transform 0.2s, opacity 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.15)";
                        e.currentTarget.style.opacity = "0.8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      @
                    </a>
                  )}
                  {user.socials?.youtube && (
                    <a
                      href={
                        user.socials.youtube.startsWith("http")
                          ? user.socials.youtube
                          : `https://youtube.com/@${user.socials.youtube}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "#ff0000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "transform 0.2s, opacity 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.15)";
                        e.currentTarget.style.opacity = "0.8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      ▶
                    </a>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  gap: "40px",
                  marginTop: "25px"
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: darkMode ? "white" : "#1f2937"
                    }}
                  >
                    0
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: darkMode ? "#a0a0b8" : "#6b7280"
                    }}
                  >
                    Properties
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: darkMode ? "white" : "#1f2937"
                    }}
                  >
                    0
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: darkMode ? "#a0a0b8" : "#6b7280"
                    }}
                  >
                    Active Deals
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ padding: "40px" }}>
          {/* Contact Section */}
          <div
            style={{
              background: darkMode ? "#3d3d5c" : "#f9fafb",
              borderRadius: "12px",
              padding: "25px",
              marginBottom: "35px",
              border: darkMode ? "1px solid #555" : "1px solid #e5e7eb"
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: darkMode ? "white" : "#1f2937",
                marginBottom: "20px"
              }}
            >
              📞 Contact Information
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px"
              }}
            >
              {/* Email Card */}
              <div
                style={{
                  background: darkMode ? "#2d2d44" : "white",
                  borderRadius: "10px",
                  padding: "20px",
                  border: darkMode ? "1px solid #444" : "1px solid #e5e7eb"
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "10px" }}>📧</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: darkMode ? "#a0a0b8" : "#6b7280",
                    marginBottom: "8px",
                    fontWeight: "600"
                  }}
                >
                  Email
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: darkMode ? "white" : "#1f2937",
                    fontWeight: "600",
                    wordBreak: "break-all"
                  }}
                >
                  {user.email || "Not provided"}
                </div>
              </div>

              {/* Phone Card */}
              <div
                style={{
                  background: darkMode ? "#2d2d44" : "white",
                  borderRadius: "10px",
                  padding: "20px",
                  border: darkMode ? "1px solid #444" : "1px solid #e5e7eb"
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "10px" }}>📱</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: darkMode ? "#a0a0b8" : "#6b7280",
                    marginBottom: "8px",
                    fontWeight: "600"
                  }}
                >
                  Phone
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: darkMode ? "white" : "#1f2937",
                    fontWeight: "600"
                  }}
                >
                  {user.phone || "Not provided"}
                </div>
              </div>

              {/* Location Card */}
              <div
                style={{
                  background: darkMode ? "#2d2d44" : "white",
                  borderRadius: "10px",
                  padding: "20px",
                  border: darkMode ? "1px solid #444" : "1px solid #e5e7eb"
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "10px" }}>📍</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: darkMode ? "#a0a0b8" : "#6b7280",
                    marginBottom: "8px",
                    fontWeight: "600"
                  }}
                >
                  Location
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: darkMode ? "white" : "#1f2937",
                    fontWeight: "600"
                  }}
                >
                  {user.location || "Not provided"}
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {user.bio && (
            <div
              style={{
                background: darkMode ? "#3d3d5c" : "#f9fafb",
                borderRadius: "12px",
                padding: "25px",
                marginBottom: "35px",
                border: darkMode ? "1px solid #555" : "1px solid #e5e7eb"
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: darkMode ? "white" : "#1f2937",
                  marginBottom: "15px"
                }}
              >
                📝 Professional Bio
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: darkMode ? "#a0a0b8" : "#6b7280",
                  lineHeight: "1.6",
                  margin: 0
                }}
              >
                {user.bio}
              </p>
            </div>
          )}

          {/* Social Media Links Section */}
          {!!(
            user.socials?.facebook ||
            user.socials?.twitter ||
            user.socials?.linkedin ||
            user.socials?.instagram ||
            user.socials?.youtube
          ) && (
            <div
              style={{
                background: darkMode ? "#1e1e2e" : "#f9fafb",
                borderRadius: "12px",
                padding: "25px",
                border: darkMode ? "1px solid #333" : "1px solid #e5e7eb",
                marginBottom: "30px"
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: darkMode ? "white" : "#1f2937",
                  marginBottom: "20px"
                }}
              >
                🌐 Social Media Links
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: "15px"
                }}
              >
                {user.socials?.facebook && (
                  <a
                    href={
                      user.socials.facebook.startsWith("http")
                        ? user.socials.facebook
                        : `https://facebook.com/${user.socials.facebook}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: darkMode ? "#2d2d44" : "white",
                      borderRadius: "10px",
                      padding: "15px",
                      border: darkMode ? "1px solid #444" : "1px solid #e5e7eb",
                      textAlign: "center",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "center",
                      justifyContent: "center",
                      color: darkMode ? "#a0a0b8" : "#6b7280",
                      fontSize: "24px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#3a3a54"
                        : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#2d2d44"
                        : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    f
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>
                      Facebook
                    </div>
                  </a>
                )}
                {user.socials?.twitter && (
                  <a
                    href={
                      user.socials.twitter.startsWith("http")
                        ? user.socials.twitter
                        : `https://twitter.com/${user.socials.twitter}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: darkMode ? "#2d2d44" : "white",
                      borderRadius: "10px",
                      padding: "15px",
                      border: darkMode ? "1px solid #444" : "1px solid #e5e7eb",
                      textAlign: "center",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "center",
                      justifyContent: "center",
                      color: darkMode ? "#a0a0b8" : "#6b7280",
                      fontSize: "24px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#3a3a54"
                        : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#2d2d44"
                        : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    𝕏
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>
                      Twitter
                    </div>
                  </a>
                )}
                {user.socials?.linkedin && (
                  <a
                    href={
                      user.socials.linkedin.startsWith("http")
                        ? user.socials.linkedin
                        : `https://linkedin.com/in/${user.socials.linkedin}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: darkMode ? "#2d2d44" : "white",
                      borderRadius: "10px",
                      padding: "15px",
                      border: darkMode ? "1px solid #444" : "1px solid #e5e7eb",
                      textAlign: "center",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "center",
                      justifyContent: "center",
                      color: darkMode ? "#a0a0b8" : "#6b7280",
                      fontSize: "24px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#3a3a54"
                        : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#2d2d44"
                        : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    in
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>
                      LinkedIn
                    </div>
                  </a>
                )}
                {user.socials?.instagram && (
                  <a
                    href={
                      user.socials.instagram.startsWith("http")
                        ? user.socials.instagram
                        : `https://instagram.com/${user.socials.instagram}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: darkMode ? "#2d2d44" : "white",
                      borderRadius: "10px",
                      padding: "15px",
                      border: darkMode ? "1px solid #444" : "1px solid #e5e7eb",
                      textAlign: "center",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "center",
                      justifyContent: "center",
                      color: darkMode ? "#a0a0b8" : "#6b7280",
                      fontSize: "24px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#3a3a54"
                        : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#2d2d44"
                        : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    @
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>
                      Instagram
                    </div>
                  </a>
                )}
                {user.socials?.youtube && (
                  <a
                    href={
                      user.socials.youtube.startsWith("http")
                        ? user.socials.youtube
                        : `https://youtube.com/@${user.socials.youtube}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: darkMode ? "#2d2d44" : "white",
                      borderRadius: "10px",
                      padding: "15px",
                      border: darkMode ? "1px solid #444" : "1px solid #e5e7eb",
                      textAlign: "center",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "center",
                      justifyContent: "center",
                      color: darkMode ? "#a0a0b8" : "#6b7280",
                      fontSize: "24px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#3a3a54"
                        : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode
                        ? "#2d2d44"
                        : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    ▶
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>
                      YouTube
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Verified Section */}
          {user.verified && user.verificationDocuments && user.verificationDocuments.length > 0 && (
            <div
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderRadius: "12px",
                padding: "25px",
                border: "2px solid #059669",
                marginBottom: "30px"
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "white",
                  marginBottom: "15px"
                }}
              >
                ✓ Verified Profile
              </h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", margin: 0 }}>
                This user has been verified through identity documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
