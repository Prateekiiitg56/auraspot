import { signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { API } from "../services/api";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  verified: boolean;
  role: string;
  persona?: string;
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

const Profile = ({ user }: { user: User | null }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSkills] = useState<string[]>(["Real Estate", "Property Management", "Investment"]);
  const [editSocials, setEditSocials] = useState({
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    youtube: ""
  });
  
  // Phone OTP verification state
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [tempPhone, setTempPhone] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Verification form state
  const [documentType, setDocumentType] = useState("AADHAR");
  const [documentNumber, setDocumentNumber] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const sendPhoneOTP = async () => {
    if (!user?.email || !tempPhone.trim()) {
      alert("Please enter a valid phone number");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch(`${API}/users/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          phone: tempPhone
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOtpSent(true);
        alert(`OTP sent! For testing: ${data.otp}`);
      } else {
        alert("Failed to send OTP");
      }
    } catch (err) {
      console.error("Failed to send OTP:", err);
      alert("Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyPhoneOTP = async () => {
    if (!user?.email || !tempPhone.trim() || !phoneOTP.trim()) {
      alert("Please enter phone and OTP");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch(`${API}/users/verify-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          phone: tempPhone,
          otp: phoneOTP
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated.user);
        setEditPhone(updated.user.phone);
        setShowPhoneOTP(false);
        setTempPhone("");
        setPhoneOTP("");
        setOtpSent(false);
        alert("Phone verified and updated successfully!");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to verify OTP");
      }
    } catch (err) {
      console.error("Failed to verify OTP:", err);
      alert("Failed to verify OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const loadProfile = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/users/email/${user.email}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditName(data.name || "");
        setEditPhone(data.phone || "");
        setEditLocation(data.location || "");
        setEditBio(data.bio || "");
        setEditSocials(data.socials || {
          facebook: "",
          twitter: "",
          linkedin: "",
          instagram: "",
          youtube: ""
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user?.email) return;

    try {
      const res = await fetch(`${API}/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: editName,
          phone: editPhone,
          location: editLocation,
          bio: editBio,
          socials: editSocials
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        const error = await res.text();
        console.error("Failed to update profile:", error);
        alert("Failed to update profile: " + error);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile: " + err);
    }
  };

  const submitVerification = async () => {
    if (!user?.email || !documentNumber.trim()) {
      alert("Please enter document number");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch(`${API}/users/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          documentType,
          documentNumber
        })
      });

      if (res.ok) {
        await loadProfile();
        setShowVerification(false);
        setDocumentNumber("");
        alert("Verification submitted successfully! Your account is now verified.");
      }
    } catch (err) {
      console.error("Verification failed:", err);
      alert("Failed to submit verification");
    } finally {
      setVerifying(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    alert("Logged out!");
  };

  if (!user) {
    return (
      <div className="page">
        <h2>You are not logged in</h2>
        <p>Please login to view profile.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="page">Loading profile...</div>;
  }

  return (
    <div style={{ 
      maxWidth: "1100px", 
      margin: "0 auto",
      background: darkMode ? "#1a1a2e" : "#e8e8e8",
      minHeight: "100vh",
      padding: "40px 20px",
      transition: "background 0.3s"
    }}>
      {/* Main Card Container */}
      <div style={{
        background: darkMode ? "#2d2d44" : "white",
        borderRadius: "12px",
        boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        {/* Top Section with Profile Image and Info */}
        <div style={{
          background: darkMode ? "#1e1e2f" : "#f5f5f5",
          padding: "50px 40px 30px",
          position: "relative"
        }}>
          {/* Dark Mode Toggle */}
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px"
          }}>
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
              <div style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: darkMode ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "56px",
                border: "2px solid " + (darkMode ? "rgba(255,255,255,0.1)" : "#e5e5e5"),
                boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                👤
              </div>
              {profile?.verified && (
                <div style={{
                  position: "absolute",
                  bottom: "0px",
                  right: "0px",
                  background: "#333",
                  color: "white",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "700",
                  border: "2px solid white"
                }}>
                  ✓
                </div>
              )}
            </div>

            {/* Name and Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{
                    margin: "0 0 4px 0",
                    fontSize: "24px",
                    color: darkMode ? "#f5f5f5" : "#000",
                    fontWeight: "600",
                    letterSpacing: "-0.3px"
                  }}>
                    {profile?.name || "User Name"}
                  </h1>
                  
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px",
                    flexWrap: "wrap"
                  }}>
                    <span style={{
                      background: "transparent",
                      color: darkMode ? "#a0a0b8" : "#666",
                      padding: "0",
                      borderRadius: "0",
                      fontSize: "13px",
                      fontWeight: "500"
                    }}>
                      {profile?.role === "ADMIN" ? "Admin" : profile?.persona === "BUYER" ? "Buyer" : profile?.persona === "SELLER" ? "Seller" : "User"}
                    </span>
                    {profile?.verified && (
                      <span style={{
                        background: "transparent",
                        color: "#000",
                        padding: "0",
                        borderRadius: "0",
                        fontSize: "13px",
                        fontWeight: "500"
                      }}>
                        · Verified
                      </span>
                    )}
                  </div>

                  <div style={{
                    color: darkMode ? "#999" : "#666",
                    fontSize: "13px",
                    marginBottom: "6px",
                    fontWeight: "500"
                  }}>
                    {profile?.email}
                  </div>
                  {profile?.location && (
                    <div style={{
                      color: darkMode ? "#999" : "#666",
                      fontSize: "13px",
                      fontWeight: "500"
                    }}>
                      {profile.location}
                    </div>
                  )}
                </div>

                {/* Social Icons */}
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  {profile?.socials?.facebook && (
                    <a
                      href={profile.socials.facebook.startsWith("http") ? profile.socials.facebook : `https://facebook.com/${profile.socials.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: darkMode ? "#333" : "#f0f0f0",
                        border: "1px solid " + (darkMode ? "#555" : "#ddd"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: darkMode ? "#fff" : "#000",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = darkMode ? "#444" : "#e8e8e8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? "#333" : "#f0f0f0";
                      }}
                    >f</a>
                  )}
                  {profile?.socials?.twitter && (
                    <a
                      href={profile.socials.twitter.startsWith("http") ? profile.socials.twitter : `https://twitter.com/${profile.socials.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: darkMode ? "#333" : "#f0f0f0",
                        border: "1px solid " + (darkMode ? "#555" : "#ddd"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: darkMode ? "#fff" : "#000",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = darkMode ? "#444" : "#e8e8e8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? "#333" : "#f0f0f0";
                      }}
                    >𝕏</a>
                  )}
                  {profile?.socials?.linkedin && (
                    <a
                      href={profile.socials.linkedin.startsWith("http") ? profile.socials.linkedin : `https://linkedin.com/in/${profile.socials.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: darkMode ? "#333" : "#f0f0f0",
                        border: "1px solid " + (darkMode ? "#555" : "#ddd"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: darkMode ? "#fff" : "#000",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = darkMode ? "#444" : "#e8e8e8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? "#333" : "#f0f0f0";
                      }}
                    >in</a>
                  )}
                  {profile?.socials?.instagram && (
                    <a
                      href={profile.socials.instagram.startsWith("http") ? profile.socials.instagram : `https://instagram.com/${profile.socials.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: darkMode ? "#333" : "#f0f0f0",
                        border: "1px solid " + (darkMode ? "#555" : "#ddd"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: darkMode ? "#fff" : "#000",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = darkMode ? "#444" : "#e8e8e8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? "#333" : "#f0f0f0";
                      }}
                    >@</a>
                  )}
                  {profile?.socials?.youtube && (
                    <a
                      href={profile.socials.youtube.startsWith("http") ? profile.socials.youtube : `https://youtube.com/@${profile.socials.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: darkMode ? "#333" : "#f0f0f0",
                        border: "1px solid " + (darkMode ? "#555" : "#ddd"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: darkMode ? "#fff" : "#000",
                        fontSize: "14px",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = darkMode ? "#444" : "#e8e8e8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = darkMode ? "#333" : "#f0f0f0";
                      }}
                    >▶</a>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: "flex",
                gap: "32px",
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid " + (darkMode ? "#333" : "#e5e5e5")
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "22px",
                    fontWeight: "600",
                    color: darkMode ? "#fff" : "#000",
                    letterSpacing: "-0.3px"
                  }}>12</div>
                  <div style={{
                    fontSize: "12px",
                    color: darkMode ? "#999" : "#666",
                    fontWeight: "500",
                    marginTop: "4px"
                  }}>Properties</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "22px",
                    fontWeight: "600",
                    color: darkMode ? "#fff" : "#000",
                    letterSpacing: "-0.3px"
                  }}>5</div>
                  <div style={{
                    fontSize: "12px",
                    color: darkMode ? "#999" : "#666",
                    fontWeight: "500",
                    marginTop: "4px"
                  }}>Active Deals</div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    padding: "8px 28px",
                    background: darkMode ? "#333" : "#000",
                    color: "white",
                    border: "1px solid " + (darkMode ? "#555" : "#000"),
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    boxShadow: "none",
                    transition: "all 0.2s",
                    letterSpacing: "-0.2px"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = darkMode ? "#444" : "#333";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = darkMode ? "#333" : "#000";
                  }}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ padding: "40px" }}>
          {/* Core Skills */}
          <div style={{ marginBottom: "35px" }}>
            <h3 style={{
              fontSize: "16px",
              fontWeight: "700",
              color: darkMode ? "white" : "#1f2937",
              marginBottom: "15px"
            }}>
              My Core Skills:
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {editSkills.map((skill, idx) => (
                <span key={idx} style={{
                  background: idx === 0 ? "#ff6b35" : darkMode ? "#3d3d5c" : "#f3f4f6",
                  color: idx === 0 ? "white" : darkMode ? "white" : "#374151",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  {skill}
                  {idx === 0 && <span>⭐⭐⭐</span>}
                  {idx === 1 && <span>⭐⭐</span>}
                  {idx === 2 && <span>⭐</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div style={{
            background: darkMode ? "#3d3d5c" : "#f9fafb",
            borderRadius: "12px",
            padding: "25px",
            marginBottom: "35px",
            border: darkMode ? "1px solid #555" : "1px solid #e5e7eb"
          }}>
            <h3 style={{
              fontSize: "16px",
              fontWeight: "700",
              color: darkMode ? "white" : "#1f2937",
              marginBottom: "20px"
            }}>
              📞 Contact Information
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px"
            }}>
              {/* Email Card */}
              <div style={{
                background: darkMode ? "#2d2d44" : "white",
                borderRadius: "10px",
                padding: "20px",
                border: darkMode ? "1px solid #444" : "1px solid #e5e7eb"
              }}>
                <div style={{
                  fontSize: "24px",
                  marginBottom: "10px"
                }}>
                  📧
                </div>
                <div style={{
                  fontSize: "12px",
                  color: darkMode ? "#a0a0b8" : "#6b7280",
                  marginBottom: "8px",
                  fontWeight: "600"
                }}>
                  Email
                </div>
                <div style={{
                  fontSize: "14px",
                  color: darkMode ? "white" : "#1f2937",
                  fontWeight: "600",
                  wordBreak: "break-all"
                }}>
                  {profile?.email || "Not provided"}
                </div>
              </div>

              {/* Phone Card */}
              <div style={{
                background: darkMode ? "#2d2d44" : "white",
                borderRadius: "10px",
                padding: "20px",
                border: darkMode ? "1px solid #444" : "1px solid #e5e7eb"
              }}>
                <div style={{
                  fontSize: "24px",
                  marginBottom: "10px"
                }}>
                  📱
                </div>
                <div style={{
                  fontSize: "12px",
                  color: darkMode ? "#a0a0b8" : "#6b7280",
                  marginBottom: "8px",
                  fontWeight: "600"
                }}>
                  Phone
                </div>
                <div style={{
                  fontSize: "14px",
                  color: darkMode ? "white" : "#1f2937",
                  fontWeight: "600"
                }}>
                  {profile?.phone || "Not provided"}
                </div>
              </div>

              {/* Location Card */}
              <div style={{
                background: darkMode ? "#2d2d44" : "white",
                borderRadius: "10px",
                padding: "20px",
                border: darkMode ? "1px solid #444" : "1px solid #e5e7eb"
              }}>
                <div style={{
                  fontSize: "24px",
                  marginBottom: "10px"
                }}>
                  📍
                </div>
                <div style={{
                  fontSize: "12px",
                  color: darkMode ? "#a0a0b8" : "#6b7280",
                  marginBottom: "8px",
                  fontWeight: "600"
                }}>
                  Location
                </div>
                <div style={{
                  fontSize: "14px",
                  color: darkMode ? "white" : "#1f2937",
                  fontWeight: "600"
                }}>
                  {profile?.location || "Not provided"}
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Links Section */}
          {!isEditing && (profile?.socials?.facebook || profile?.socials?.twitter || profile?.socials?.linkedin || profile?.socials?.instagram || profile?.socials?.youtube) && (
            <div style={{
              background: darkMode ? "#1e1e2e" : "#f9fafb",
              borderRadius: "12px",
              padding: "25px",
              border: darkMode ? "1px solid #333" : "1px solid #e5e7eb",
              marginBottom: "30px"
            }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "700",
                color: darkMode ? "white" : "#1f2937",
                marginBottom: "20px"
              }}>
                🌐 Social Media Links
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                gap: "15px"
              }}>
                {profile?.socials?.facebook && (
                  <a
                    href={profile.socials.facebook.startsWith("http") ? profile.socials.facebook : `https://facebook.com/${profile.socials.facebook}`}
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
                      e.currentTarget.style.background = darkMode ? "#3a3a54" : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode ? "#2d2d44" : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    f
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>Facebook</div>
                  </a>
                )}
                {profile?.socials?.twitter && (
                  <a
                    href={profile.socials.twitter.startsWith("http") ? profile.socials.twitter : `https://twitter.com/${profile.socials.twitter}`}
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
                      e.currentTarget.style.background = darkMode ? "#3a3a54" : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode ? "#2d2d44" : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    𝕏
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>Twitter</div>
                  </a>
                )}
                {profile?.socials?.linkedin && (
                  <a
                    href={profile.socials.linkedin.startsWith("http") ? profile.socials.linkedin : `https://linkedin.com/in/${profile.socials.linkedin}`}
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
                      e.currentTarget.style.background = darkMode ? "#3a3a54" : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode ? "#2d2d44" : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    in
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>LinkedIn</div>
                  </a>
                )}
                {profile?.socials?.instagram && (
                  <a
                    href={profile.socials.instagram.startsWith("http") ? profile.socials.instagram : `https://instagram.com/${profile.socials.instagram}`}
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
                      e.currentTarget.style.background = darkMode ? "#3a3a54" : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode ? "#2d2d44" : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    @
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>Instagram</div>
                  </a>
                )}
                {profile?.socials?.youtube && (
                  <a
                    href={profile.socials.youtube.startsWith("http") ? profile.socials.youtube : `https://youtube.com/@${profile.socials.youtube}`}
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
                      e.currentTarget.style.background = darkMode ? "#3a3a54" : "#f3f4f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = darkMode ? "#2d2d44" : "white";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    ▶
                    <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>YouTube</div>
                  </a>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px" }}>
            {/* Left Column */}
            <div>
              {/* Professional Bio */}
              {isEditing ? (
                <div style={{ marginBottom: "30px" }}>
                  <h3 style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: darkMode ? "white" : "#1f2937",
                    marginBottom: "15px"
                  }}>
                    Edit Profile Information
                  </h3>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      fontSize: "13px",
                      color: darkMode ? "#a0a0b8" : "#374151"
                    }}>Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "15px",
                        background: darkMode ? "#1a1a2e" : "white",
                        color: darkMode ? "white" : "#1f2937",
                        boxSizing: "border-box"
                      }}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      fontSize: "13px",
                      color: darkMode ? "#a0a0b8" : "#374151"
                    }}>Phone (with OTP Verification)</label>
                    
                    {showPhoneOTP ? (
                      <div>
                        <input
                          type="tel"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value)}
                          disabled={otpSent}
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "15px",
                            background: darkMode ? "#1a1a2e" : "white",
                            color: darkMode ? "white" : "#1f2937",
                            boxSizing: "border-box",
                            marginBottom: "10px",
                            opacity: otpSent ? 0.6 : 1
                          }}
                          placeholder="Enter phone number"
                        />
                        
                        {!otpSent ? (
                          <button
                            onClick={sendPhoneOTP}
                            disabled={otpLoading}
                            style={{
                              width: "100%",
                              padding: "10px",
                              background: "#667eea",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: otpLoading ? "not-allowed" : "pointer",
                              fontWeight: "600",
                              fontSize: "13px",
                              opacity: otpLoading ? 0.6 : 1
                            }}
                          >
                            {otpLoading ? "Sending..." : "📤 Send OTP"}
                          </button>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={phoneOTP}
                              onChange={(e) => setPhoneOTP(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "12px",
                                border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                                borderRadius: "8px",
                                fontSize: "15px",
                                background: darkMode ? "#1a1a2e" : "white",
                                color: darkMode ? "white" : "#1f2937",
                                boxSizing: "border-box",
                                marginBottom: "10px"
                              }}
                              placeholder="Enter OTP"
                            />
                            <button
                              onClick={verifyPhoneOTP}
                              disabled={otpLoading}
                              style={{
                                width: "100%",
                                padding: "10px",
                                background: "#22c55e",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: otpLoading ? "not-allowed" : "pointer",
                                fontWeight: "600",
                                fontSize: "13px",
                                opacity: otpLoading ? 0.6 : 1
                              }}
                            >
                              {otpLoading ? "Verifying..." : "✓ Verify OTP"}
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="tel"
                          value={editPhone}
                          disabled
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "15px",
                            background: darkMode ? "#1a1a2e" : "white",
                            color: darkMode ? "white" : "#1f2937",
                            boxSizing: "border-box",
                            opacity: 0.6
                          }}
                          placeholder="Enter your phone number"
                        />
                        <button
                          onClick={() => {
                            setShowPhoneOTP(true);
                            setTempPhone(editPhone);
                          }}
                          style={{
                            padding: "12px 16px",
                            background: "#667eea",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "13px",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🔒 Verify
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      fontSize: "13px",
                      color: darkMode ? "#a0a0b8" : "#374151"
                    }}>Location</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "15px",
                        background: darkMode ? "#1a1a2e" : "white",
                        color: darkMode ? "white" : "#1f2937",
                        boxSizing: "border-box"
                      }}
                      placeholder="Enter your location"
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      fontSize: "13px",
                      color: darkMode ? "#a0a0b8" : "#374151"
                    }}>Professional Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "15px",
                        background: darkMode ? "#1a1a2e" : "white",
                        color: darkMode ? "white" : "#1f2937",
                        boxSizing: "border-box",
                        minHeight: "100px",
                        fontFamily: "inherit",
                        resize: "vertical"
                      }}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "12px",
                      fontWeight: "700",
                      fontSize: "14px",
                      color: darkMode ? "#a0a0b8" : "#374151"
                    }}>Social Media Links</label>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {/* Facebook */}
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "12px",
                          color: darkMode ? "#7a7a9a" : "#6b7280"
                        }}>f Facebook</label>
                        <input
                          type="text"
                          value={editSocials.facebook}
                          onChange={(e) => setEditSocials({...editSocials, facebook: e.target.value})}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px",
                            background: darkMode ? "#1a1a2e" : "white",
                            color: darkMode ? "white" : "#1f2937",
                            boxSizing: "border-box"
                          }}
                          placeholder="facebook.com/yourprofile"
                        />
                      </div>

                      {/* Twitter/X */}
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "12px",
                          color: darkMode ? "#7a7a9a" : "#6b7280"
                        }}>𝕏 Twitter</label>
                        <input
                          type="text"
                          value={editSocials.twitter}
                          onChange={(e) => setEditSocials({...editSocials, twitter: e.target.value})}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px",
                            background: darkMode ? "#1a1a2e" : "white",
                            color: darkMode ? "white" : "#1f2937",
                            boxSizing: "border-box"
                          }}
                          placeholder="twitter.com/yourhandle"
                        />
                      </div>

                      {/* LinkedIn */}
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "12px",
                          color: darkMode ? "#7a7a9a" : "#6b7280"
                        }}>in LinkedIn</label>
                        <input
                          type="text"
                          value={editSocials.linkedin}
                          onChange={(e) => setEditSocials({...editSocials, linkedin: e.target.value})}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px",
                            background: darkMode ? "#1a1a2e" : "white",
                            color: darkMode ? "white" : "#1f2937",
                            boxSizing: "border-box"
                          }}
                          placeholder="linkedin.com/in/yourprofile"
                        />
                      </div>

                      {/* Instagram */}
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "12px",
                          color: darkMode ? "#7a7a9a" : "#6b7280"
                        }}>@ Instagram</label>
                        <input
                          type="text"
                          value={editSocials.instagram}
                          onChange={(e) => setEditSocials({...editSocials, instagram: e.target.value})}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px",
                            background: darkMode ? "#1a1a2e" : "white",
                            color: darkMode ? "white" : "#1f2937",
                            boxSizing: "border-box"
                          }}
                          placeholder="instagram.com/yourprofile"
                        />
                      </div>

                      {/* YouTube */}
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "12px",
                          color: darkMode ? "#7a7a9a" : "#6b7280"
                        }}>▶ YouTube</label>
                        <input
                          type="text"
                          value={editSocials.youtube}
                          onChange={(e) => setEditSocials({...editSocials, youtube: e.target.value})}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: darkMode ? "2px solid #444" : "2px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px",
                            background: darkMode ? "#1a1a2e" : "white",
                            color: darkMode ? "white" : "#1f2937",
                            boxSizing: "border-box"
                          }}
                          placeholder="youtube.com/@yourhandle"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={saveProfile}
                    style={{
                      padding: "12px 30px",
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "15px",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)"
                    }}
                  >
                    💾 Save Changes
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: "30px" }}>
                  <h3 style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: darkMode ? "white" : "#1f2937",
                    marginBottom: "15px"
                  }}>
                    Professional Bio
                    <span style={{
                      marginLeft: "10px",
                      fontSize: "12px",
                      color: darkMode ? "#a0a0b8" : "#6b7280",
                      fontWeight: "400"
                    }}>
                      Member since 2024
                    </span>
                  </h3>
                  <p style={{
                    color: darkMode ? "#a0a0b8" : "#4b5563",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    marginBottom: "12px"
                  }}>
                    {editBio || "Real estate enthusiast with passion for helping people find their dream properties. Specializing in residential and commercial properties with focus on customer satisfaction and trust."}
                  </p>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "8px 15px",
                    marginTop: "15px",
                    fontSize: "13px"
                  }}>
                    {profile?.phone && (
                      <>
                        <span style={{ color: darkMode ? "#a0a0b8" : "#6b7280" }}>📱 Phone:</span>
                        <span style={{ color: darkMode ? "white" : "#1f2937", fontWeight: "600" }}>{profile.phone}</span>
                      </>
                    )}
                    <span style={{ color: darkMode ? "#a0a0b8" : "#6b7280" }}>🏢 Company:</span>
                    <span style={{ color: darkMode ? "white" : "#1f2937", fontWeight: "600" }}>AuraSpot Platform</span>
                  </div>
                </div>
              )}

              {/* My Achievements */}
              <div>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: darkMode ? "white" : "#1f2937",
                  marginBottom: "20px"
                }}>
                  My Achievements (4)
                </h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: "20px"
                }}>
                  {[
                    { icon: "🏆", color: "#ff6b35", title: "Top Seller" },
                    { icon: "⭐", color: "#fbbf24", title: "5-Star Rated" },
                    { icon: "🎯", color: "#667eea", title: "Deal Maker" },
                    { icon: "💎", color: "#764ba2", title: "Premium User" }
                  ].map((badge, idx) => (
                    <div key={idx} style={{
                      textAlign: "center",
                      padding: "20px 10px",
                      background: darkMode ? "#3d3d5c" : "#f9fafb",
                      borderRadius: "12px",
                      transition: "transform 0.2s",
                      cursor: "pointer"
                    }}
                      onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                      onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <div style={{
                        width: "60px",
                        height: "60px",
                        margin: "0 auto 10px",
                        borderRadius: "50%",
                        background: badge.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        boxShadow: `0 4px 12px ${badge.color}40`
                      }}>
                        {badge.icon}
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: darkMode ? "#a0a0b8" : "#6b7280",
                        fontWeight: "600"
                      }}>
                        {badge.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "700",
                color: darkMode ? "white" : "#1f2937",
                marginBottom: "15px"
              }}>
                Quick Actions
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Link to="/my-deals" style={{ textDecoration: "none" }}>
                  <div style={{
                    background: darkMode ? "#3d3d5c" : "#f9fafb",
                    padding: "15px 20px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: darkMode ? "1px solid #555" : "1px solid #e5e7eb"
                  }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = darkMode ? "#4d4d6c" : "#667eea";
                      e.currentTarget.style.transform = "translateX(5px)";
                      const textEl = e.currentTarget.querySelector("span") as HTMLElement;
                      if (textEl) textEl.style.color = "white";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = darkMode ? "#3d3d5c" : "#f9fafb";
                      e.currentTarget.style.transform = "translateX(0)";
                      const textEl = e.currentTarget.querySelector("span") as HTMLElement;
                      if (textEl) textEl.style.color = darkMode ? "white" : "#374151";
                    }}
                  >
                    <div style={{ fontSize: "24px" }}>💼</div>
                    <span style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: darkMode ? "white" : "#374151"
                    }}>My Deals</span>
                  </div>
                </Link>

                <Link to="/notifications" style={{ textDecoration: "none" }}>
                  <div style={{
                    background: darkMode ? "#3d3d5c" : "#f9fafb",
                    padding: "15px 20px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: darkMode ? "1px solid #555" : "1px solid #e5e7eb"
                  }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = darkMode ? "#4d4d6c" : "#667eea";
                      e.currentTarget.style.transform = "translateX(5px)";
                      const textEl = e.currentTarget.querySelector("span") as HTMLElement;
                      if (textEl) textEl.style.color = "white";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = darkMode ? "#3d3d5c" : "#f9fafb";
                      e.currentTarget.style.transform = "translateX(0)";
                      const textEl = e.currentTarget.querySelector("span") as HTMLElement;
                      if (textEl) textEl.style.color = darkMode ? "white" : "#374151";
                    }}
                  >
                    <div style={{ fontSize: "24px" }}>🔔</div>
                    <span style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: darkMode ? "white" : "#374151"
                    }}>Notifications</span>
                  </div>
                </Link>

                <Link to="/add" style={{ textDecoration: "none" }}>
                  <div style={{
                    background: darkMode ? "#3d3d5c" : "#f9fafb",
                    padding: "15px 20px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: darkMode ? "1px solid #555" : "1px solid #e5e7eb"
                  }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = darkMode ? "#4d4d6c" : "#667eea";
                      e.currentTarget.style.transform = "translateX(5px)";
                      const textEl = e.currentTarget.querySelector("span") as HTMLElement;
                      if (textEl) textEl.style.color = "white";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = darkMode ? "#3d3d5c" : "#f9fafb";
                      e.currentTarget.style.transform = "translateX(0)";
                      const textEl = e.currentTarget.querySelector("span") as HTMLElement;
                      if (textEl) textEl.style.color = darkMode ? "white" : "#374151";
                    }}
                  >
                    <div style={{ fontSize: "24px" }}>➕</div>
                    <span style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: darkMode ? "white" : "#374151"
                    }}>Add Property</span>
                  </div>
                </Link>

                <Link to="/explore" style={{ textDecoration: "none" }}>
                  <div style={{
                    background: darkMode ? "#3d3d5c" : "#f9fafb",
                    padding: "15px 20px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: darkMode ? "1px solid #555" : "1px solid #e5e7eb"
                  }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = darkMode ? "#4d4d6c" : "#667eea";
                      e.currentTarget.style.transform = "translateX(5px)";
                      const textEl = e.currentTarget.querySelector("span") as HTMLElement;
                      if (textEl) textEl.style.color = "white";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = darkMode ? "#3d3d5c" : "#f9fafb";
                      e.currentTarget.style.transform = "translateX(0)";
                      const textEl = e.currentTarget.querySelector("span") as HTMLElement;
                      if (textEl) textEl.style.color = darkMode ? "white" : "#374151";
                    }}
                  >
                    <div style={{ fontSize: "24px" }}>🔍</div>
                    <span style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: darkMode ? "white" : "#374151"
                    }}>Explore Properties</span>
                  </div>
                </Link>
              </div>

              {/* Verification Section */}
              {profile?.verified ? (
                <div style={{
                  marginTop: "25px",
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  borderRadius: "12px",
                  padding: "25px",
                  color: "white",
                  boxShadow: "0 8px 24px rgba(34, 197, 94, 0.3)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                    <div style={{
                      fontSize: "40px",
                      background: "rgba(255,255,255,0.2)",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      ✓
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "700" }}>
                        Account Verified
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", opacity: 0.95 }}>
                        Your identity has been verified
                      </p>
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "12px",
                    marginBottom: "12px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span>Verification Type:</span>
                      <span style={{ fontWeight: "600" }}>
                        {profile?.verificationDocuments?.[0]?.type === "AADHAR" ? "Aadhar Card" :
                         profile?.verificationDocuments?.[0]?.type === "PAN" ? "PAN Card" :
                         profile?.verificationDocuments?.[0]?.type === "DRIVING_LICENSE" ? "Driving License" :
                         "Passport"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Verified On:</span>
                      <span style={{ fontWeight: "600" }}>
                        {profile?.verificationDocuments?.[0]?.uploadedAt ? 
                          new Date(profile.verificationDocuments[0].uploadedAt).toLocaleDateString() :
                          "N/A"
                        }
                      </span>
                    </div>
                  </div>
                  <button
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(255,255,255,0.25)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.4)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.35)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                    }}
                  >
                    🎖️ View Verification Details
                  </button>
                </div>
              ) : (
                <div style={{
                  marginTop: "25px",
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  borderRadius: "12px",
                  padding: "25px",
                  color: "white",
                  boxShadow: "0 8px 24px rgba(251, 191, 36, 0.3)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                    <div style={{
                      fontSize: "32px",
                      background: "rgba(255,255,255,0.2)",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      🔒
                    </div>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "700" }}>
                        Get Verified
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", opacity: 0.95 }}>
                        Build trust and unlock premium features
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVerification(!showVerification)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "white",
                      color: "#f59e0b",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "14px",
                      marginBottom: "10px",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {showVerification ? "Cancel Verification" : "✓ Start Verification"}
                  </button>

                  {showVerification && (
                    <div style={{
                      marginTop: "15px",
                      background: "rgba(255,255,255,0.15)",
                      padding: "20px",
                      borderRadius: "12px",
                      backdropFilter: "blur(10px)"
                    }}>
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "600",
                          fontSize: "13px"
                        }}>
                          Document Type
                        </label>
                        <select
                          value={documentType}
                          onChange={(e) => setDocumentType(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            background: "white",
                            color: "#374151",
                            fontWeight: "500",
                            boxSizing: "border-box"
                          }}
                        >
                          <option value="AADHAR">🪳 Aadhar Card</option>
                          <option value="PAN">📋 PAN Card</option>
                          <option value="DRIVING_LICENSE">🚗 Driving License</option>
                          <option value="PASSPORT">🛂 Passport</option>
                        </select>
                      </div>
                      
                      <div style={{ marginBottom: "15px" }}>
                        <label style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "600",
                          fontSize: "13px"
                        }}>
                          Document Number
                        </label>
                        <input
                          type="text"
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            background: "white",
                            color: "#374151",
                            boxSizing: "border-box"
                          }}
                          placeholder="Enter your document number"
                        />
                      </div>
                      
                      <button
                        onClick={submitVerification}
                        disabled={verifying}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "#22c55e",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: verifying ? "not-allowed" : "pointer",
                          fontWeight: "700",
                          fontSize: "14px",
                          opacity: verifying ? 0.6 : 1,
                          transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                          if (!verifying) {
                            e.currentTarget.style.background = "#16a34a";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "#22c55e";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {verifying ? "⏳ Verifying..." : "✓ Submit Verification"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  marginTop: "20px",
                  padding: "14px",
                  background: darkMode ? "#dc2626" : "#ef4444",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  color: "white",
                  fontWeight: "700",
                  fontSize: "14px",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                  transition: "transform 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

