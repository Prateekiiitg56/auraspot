import { useState } from "react";
import { auth } from "../services/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { API } from "../services/api";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signup = async () => {
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
    } catch (err) {
      console.error("Signup error:", err);
      alert("Failed to create account");
    }
  };

  return (
    <div className="page auth-box">
      <h2>Create Account</h2>

      <input 
        placeholder="Full Name"
        onChange={e => setName(e.target.value)} 
      />

      <input 
        placeholder="Email"
        onChange={e => setEmail(e.target.value)} 
      />

      <input 
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)} 
      />

      <button onClick={signup}>Sign Up</button>
    </div>
  );
};

export default Signup;
