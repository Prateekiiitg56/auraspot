import { useState, useEffect } from "react";
import { auth, googleProvider } from "../services/firebase";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../services/api";

// Detect if user is on mobile/iOS
const isMobile = () => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const navigate = useNavigate();

  // Handle redirect result when coming back from Google sign-in on mobile
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          // Sync user to MongoDB
          try {
            await fetch(`${API}/users/sync`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                firebaseUid: user.uid,
                name: user.displayName,
                email: user.email
              })
            });
          } catch (syncErr) {
            console.error("Sync error (non-fatal):", syncErr);
          }
          navigate("/profile");
        }
      } catch (err) {
        console.error("Redirect result error:", err);
      }
    };
    handleRedirectResult();
  }, [navigate]);

  const login = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoadingEmail(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Sync user to MongoDB
      try {
        await fetch(`${API}/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: result.user.uid,
            name: result.user.displayName || email.split("@")[0],
            email: result.user.email
          })
        });
      } catch (syncErr) {
        console.error("Sync error (non-fatal):", syncErr);
        // Don't fail login if sync fails
      }

      navigate("/profile");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") {
        alert("User not found. Please sign up first.");
      } else if (err.code === "auth/wrong-password") {
        alert("Incorrect password");
      } else {
        alert("Login failed: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  const googleLogin = async () => {
    if (loadingGoogle) return;
    setLoadingGoogle(true);

    try {
      // Use redirect on mobile (iOS Safari blocks popups)
      if (isMobile()) {
        await signInWithRedirect(auth, googleProvider);
        // The result will be handled in useEffect after redirect
        return;
      }

      // Use popup on desktop
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 🔥 SYNC user to MongoDB (non-critical)
      try {
        await fetch(`${API}/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: user.uid,
            name: user.displayName,
            email: user.email
          })
        });
      } catch (syncErr) {
        console.error("Sync error (non-fatal):", syncErr);
      }

      navigate("/profile");
    } catch (err: any) {
      console.error("Google login error:", err);
      alert("Google login failed: " + (err.message || "Please try email/password login"));
    } finally {
      setLoadingGoogle(false);
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
            Welcome Back
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            Sign in to your AuraSpot account
          </p>
        </div>

        {/* Email Input */}
        <div style={{ marginBottom: "20px" }}>
          <input
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
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
            placeholder="Password"
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

        {/* Login Button */}
        <button 
          onClick={login} 
          disabled={loadingEmail}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: loadingEmail 
              ? "rgba(102, 126, 234, 0.3)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "16px",
            cursor: loadingEmail ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            marginBottom: "20px"
          }}
          onMouseEnter={(e) => {
            if (!loadingEmail) {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          {loadingEmail ? "Logging in..." : "Sign In"}
        </button>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "28px 0",
          color: "#64748b"
        }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(102, 126, 234, 0.2)" }}></div>
          <span style={{ fontSize: "12px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(102, 126, 234, 0.2)" }}></div>
        </div>

        {/* Google Button */}
        <button
          className="google-btn"
          onClick={googleLogin}
          disabled={loadingGoogle}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "rgba(102, 126, 234, 0.1)",
            border: "1px solid rgba(102, 126, 234, 0.3)",
            borderRadius: "8px",
            color: "#cbd5e1",
            fontWeight: "600",
            fontSize: "16px",
            cursor: loadingGoogle ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
          onMouseEnter={(e) => {
            if (!loadingGoogle) {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(102, 126, 234, 0.2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#667eea";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(102, 126, 234, 0.1)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(102, 126, 234, 0.3)";
          }}
        >
          <span>🔐</span>
          {loadingGoogle ? "Signing in..." : "Continue with Google"}
        </button>

        {/* Signup Link */}
        <p style={{
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "14px",
          margin: "0"
        }}>
          New here?{" "}
          <Link 
            to="/signup"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontWeight: "600",
              transition: "color 0.3s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#764ba2"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#667eea"}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
