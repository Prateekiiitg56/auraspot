import { signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";

const Profile = ({ user }: { user: User | null }) => {
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

  return (
    <div className="page profile">
      <h2>My Profile</h2>

      <div className="profile-card">
        <div className="avatar">👤</div>

        <div className="profile-info">
          <h3>{user.displayName || "User"}</h3>
          <p>{user.email}</p>
        </div>
      </div>

      {/* ===== ACTION HUB ===== */}

      <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/my-deals">
          <button className="profile-btn">My Deals</button>
        </Link>

        <Link to="/notifications">
          <button className="profile-btn">Notifications</button>
        </Link>

        <Link to="/add">
          <button className="profile-btn">Add Property</button>
        </Link>
      </div>

      {/* ===== LOGOUT ===== */}

      <button
        onClick={logout}
        style={{
          marginTop: "30px",
          padding: "10px 18px",
          background: "#ef4444",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          color: "white",
          fontWeight: "bold"
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Profile;
