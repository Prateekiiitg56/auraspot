const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const User = require("../models/User");

// Token verification only needs the project ID (Google's public keys are fetched
// automatically). A service account is optional and only used when provided.
const initFirebase = () => {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    initializeApp({ credential: cert(JSON.parse(serviceAccount)), projectId });
  } else if (projectId) {
    initializeApp({ projectId });
  } else {
    throw new Error("FIREBASE_PROJECT_ID is not configured");
  }
};

const readToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

const verify = async (req) => {
  const token = readToken(req);
  if (!token) return null;
  initFirebase();
  return getAuth().verifyIdToken(token);
};

/**
 * Requires a valid Firebase ID token. Sets:
 *   req.firebaseUser - decoded token
 *   req.user         - matching User document (null only on the /users/sync route)
 */
const requireAuth = async (req, res, next) => {
  let decoded;
  try {
    decoded = await verify(req);
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
  if (!decoded) {
    return res.status(401).json({ message: "Authentication required" });
  }

  req.firebaseUser = decoded;
  req.user = await User.findOne({ firebaseUid: decoded.uid });
  if (!req.user && !req.allowUnsyncedUser) {
    return res.status(401).json({ message: "Account not found. Please sign in again." });
  }
  next();
};

/** Same as requireAuth but lets a signed-in user without a DB record through (used by /users/sync). */
const requireFirebaseUser = (req, res, next) => {
  req.allowUnsyncedUser = true;
  return requireAuth(req, res, next);
};

/** Attaches req.user when a valid token is present; never rejects. */
const optionalAuth = async (req, res, next) => {
  try {
    const decoded = await verify(req);
    if (decoded) {
      req.firebaseUser = decoded;
      req.user = await User.findOne({ firebaseUid: decoded.uid });
    }
  } catch {
    // Invalid token on a public route: treat as anonymous.
  }
  next();
};

/** Rejects when the :email route param is not the signed-in user's email. */
const requireSelfEmail = (param = "email") => (req, res, next) => {
  if (!req.user || req.params[param]?.toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ message: "Not authorized" });
  }
  next();
};

const sameId = (a, b) => !!a && !!b && String(a._id || a) === String(b._id || b);

module.exports = { requireAuth, requireFirebaseUser, optionalAuth, requireSelfEmail, sameId };
