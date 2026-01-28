import { useState } from "react";
import { auth, googleProvider } from "../services/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const navigate = useNavigate();

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/profile");
    } catch (err) {
      alert("Login failed");
    }
  };

const googleLogin = async () => {
  if (loadingGoogle) return;
  setLoadingGoogle(true);

  try {
    const result = await signInWithPopup(auth, googleProvider);

    const user = result.user;

    // 🔥 SYNC user to MongoDB
    await fetch(`${API}/users/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: user.uid,
        name: user.displayName,
        email: user.email
      })
    });

    navigate("/profile");
  } catch (err) {
    console.error(err);
    alert("Google login failed");
  } finally {
    setLoadingGoogle(false);
  }
};


  return (
    <div className="page auth-box">
      <h2>Welcome Back</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={login}>Login</button>

      <p style={{ margin: "12px 0" }}>
        New here? <Link to="/signup">Create account</Link>
      </p>

      <hr />

      <button
        className="google-btn"
        onClick={googleLogin}
        disabled={loadingGoogle}
      >
        {loadingGoogle ? "Signing in..." : "Continue with Google"}
      </button>
    </div>
  );
};

export default Login;
