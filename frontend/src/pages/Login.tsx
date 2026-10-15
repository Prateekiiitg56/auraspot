import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import AuthLayout, { GoogleIcon } from "../components/AuthLayout";
import { toast } from "../components/Feedback";
import { authErrorMessage } from "../services/authErrors";

// Popups are unreliable on mobile browsers; use the redirect flow there
const prefersRedirect = () =>
  /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 0 && /Macintosh/.test(navigator.userAgent));

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Surface errors from the mobile Google redirect flow (success is handled by AuthProvider)
  useEffect(() => {
    getRedirectResult(auth).catch((err) => setError(authErrorMessage(err, "Google sign-in failed.")));
  }, []);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingEmail(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Navigation happens in <GuestOnly> once the session is established
    } catch (err) {
      setError(authErrorMessage(err, "Sign-in failed. Please try again."));
      setLoadingEmail(false);
    }
  };

  const googleLogin = async () => {
    setError("");
    setLoadingGoogle(true);
    try {
      if (prefersRedirect()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(authErrorMessage(err, "Google sign-in failed. Try email and password instead."));
      setLoadingGoogle(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email address first, then choose “Forgot password?” again.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success("If an account exists for this email, a reset link is on its way.");
    } catch (err) {
      setError(authErrorMessage(err, "Could not send the reset email."));
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your listings, rentals and messages.">
      <button type="button" className="btn btn-outline btn-block" onClick={googleLogin} disabled={loadingGoogle}>
        <GoogleIcon />
        {loadingGoogle ? "Connecting…" : "Continue with Google"}
      </button>

      <div className="divider-text"><span>or</span></div>

      <form onSubmit={login} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <div className="field-label-row">
            <label htmlFor="login-password">Password</label>
            <button type="button" className="link-btn" onClick={resetPassword}>
              Forgot password?
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-solid btn-block" disabled={loadingEmail || !email || !password}>
          {loadingEmail ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        New to AuraSpot? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
