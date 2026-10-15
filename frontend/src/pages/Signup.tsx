import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import AuthLayout, { GoogleIcon } from "../components/AuthLayout";
import { authErrorMessage } from "../services/authErrors";

const Signup = () => {
  const { refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Enter your full name.");
    if (password.length < 6) return setError("Choose a password with at least 6 characters.");

    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(res.user, { displayName: name.trim() });
      await refreshProfile(name.trim());
    } catch (err) {
      setError(authErrorMessage(err, "Could not create your account. Please try again."));
      setLoading(false);
    }
  };

  const googleSignup = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(authErrorMessage(err, "Google sign-up failed."));
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="List properties, request rentals and track payments for free.">
      <button type="button" className="btn btn-outline btn-block" onClick={googleSignup}>
        <GoogleIcon />
        Sign up with Google
      </button>

      <div className="divider-text"><span>or</span></div>

      <form onSubmit={signup} noValidate>
        <div className="field">
          <label htmlFor="signup-name">Full name</label>
          <input id="signup-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="signup-email">Email</label>
          <input id="signup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="signup-password-hint"
            required
          />
          <p id="signup-password-hint" className="field-hint">At least 6 characters.</p>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-solid btn-block" disabled={loading || !email || !password}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
