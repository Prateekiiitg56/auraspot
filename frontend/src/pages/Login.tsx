import { useState } from "react";
import { auth, googleProvider } from "../services/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    await signInWithEmailAndPassword(auth, email, password);
    navigate("/profile");
  };

  const googleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
    navigate("/profile");
  };

  return (
    <div className="page auth-box">
      <h2>Welcome Back</h2>

      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

      <button onClick={login}>Login</button>

      <p style={{ margin: "12px 0" }}>
        New here? <Link to="/signup">Create account</Link>
      </p>

      <hr />

      <button className="google-btn" onClick={googleLogin}>
        Continue with Google
      </button>
    </div>
  );
};

export default Login;
