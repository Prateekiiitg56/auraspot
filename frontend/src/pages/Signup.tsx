import { useState } from "react";
import { auth } from "../services/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { API } from "../services/api";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signup = async () => {
    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(res.user, {
        displayName: name
      });

      // Sync user to MongoDB
      await fetch(`${API}/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: res.user.uid,
          name: name,
          email: email
        })
      });

      navigate("/profile");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        alert("Email already registered. Please login instead.");
      } else if (err.code === "auth/weak-password") {
        alert("Password is too weak. Use at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        alert("Invalid email address");
      } else {
        alert("Failed to create account: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "440px",
        width: "100%",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(45, 55, 72, 0.9) 100%)",
        border: "1px solid rgba(102, 126, 234, 0.2)",
        borderRadius: "20px",
        padding: "48px 40px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 20px 60px rgba(102, 126, 234, 0.15)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{
            fontSize: "32px",
            marginBottom: "8px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Create Account
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            Join AuraSpot today and start exploring
          </p>
        </div>

        {/* Name Input */}
        <div style={{ marginBottom: "20px" }}>
          <input 
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.3s ease"
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "#667eea";
              (e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 12px rgba(102, 126, 234, 0.3)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(102, 126, 234, 0.3)";
              (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
            }}
          />
        </div>

        {/* Email Input */}
        <div style={{ marginBottom: "20px" }}>
          <input 
            placeholder="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.3s ease"
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "#667eea";
              (e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 12px rgba(102, 126, 234, 0.3)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(102, 126, 234, 0.3)";
              (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
            }}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: "28px" }}>
          <input 
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(102, 126, 234, 0.3)",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.3s ease"
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "#667eea";
              (e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 12px rgba(102, 126, 234, 0.3)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(102, 126, 234, 0.3)";
              (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
            }}
          />
        </div>

        {/* Sign Up Button */}
        <button 
          onClick={signup} 
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: loading 
              ? "rgba(102, 126, 234, 0.3)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        {/* Login Link */}
        <p style={{
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "14px",
          margin: "28px 0 0 0"
        }}>
          Already have an account?{" "}
          <Link 
            to="/login"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "600",
              transition: "color 0.3s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#764ba2"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#667eea"}
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
