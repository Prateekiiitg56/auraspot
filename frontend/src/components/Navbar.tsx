import { Link } from "react-router-dom";
import type { User } from "firebase/auth";

const Navbar = ({ user }: { user: User | null }) => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <h2 className="logo">Smart Property Manager</h2>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/explore">Explore Properties</Link>
          <Link to="/notifications">🔔</Link>
          {user && <Link to="/my-deals">💼</Link>}
          {user && <Link to="/profile">Profile</Link>}
          {!user && <Link to="/login">Login</Link>}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
