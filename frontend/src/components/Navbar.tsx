import { Link } from "react-router-dom";
import type { User } from "firebase/auth";

const Navbar = ({ user }: { user: User | null }) => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo">
          <span className="logo-main">AuraSpot</span>
          <span className="logo-tagline">Smart Property Manager</span>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/ai-match">AI Match</Link>
          <Link to="/notifications">Notifications</Link>
          {user && <Link to="/my-deals">My Deals</Link>}
          {user && <Link to="/profile">Profile</Link>}
          {!user && <Link to="/login">Login</Link>}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
