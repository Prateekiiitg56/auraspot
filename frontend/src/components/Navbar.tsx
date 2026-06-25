import { Link, useLocation } from "react-router-dom";
import type { User } from "firebase/auth";
import { useTheme } from "../context/ThemeContext";
import { useState, useCallback } from "react";

const Navbar = ({ user }: { user: User | null }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Helper to check if link is active
  const isActive = (path: string) => location.pathname === path;

  const linkStyle = (path: string) => ({
    ...(isActive(path) ? {
      color: "#667eea",
      background: "rgba(102, 126, 234, 0.15)",
      borderRadius: "6px"
    } : {})
  });

  return (
    <nav className={`navbar ${darkMode ? "" : "navbar-light"}`}>
      <div className="nav-container">
        <Link to="/" style={{ textDecoration: "none" }} onClick={closeMenu}>
          <div className="logo">
            <span className="logo-main">AuraSpot</span>
            <span className="logo-tagline">Smart Property Manager</span>
          </div>
        </Link>

        {/* Hamburger button for mobile */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <Link to="/" style={linkStyle("/")} onClick={closeMenu}>Home</Link>
          <Link to="/explore" style={linkStyle("/explore")} onClick={closeMenu}>Explore</Link>
          <Link to="/ai-match" style={linkStyle("/ai-match")} onClick={closeMenu}>AI Match</Link>
          {user && <Link to="/rent-manager" style={linkStyle("/rent-manager")} onClick={closeMenu}>Rent Manager</Link>}
          {user && <Link to="/maintenance" style={linkStyle("/maintenance")} onClick={closeMenu}>Maintenance</Link>}
          {user && <Link to="/analytics" style={linkStyle("/analytics")} onClick={closeMenu}>Analytics</Link>}
          <Link to="/notifications" style={linkStyle("/notifications")} onClick={closeMenu}>Notifications</Link>
          {user && <Link to="/my-deals" style={linkStyle("/my-deals")} onClick={closeMenu}>My Deals</Link>}
          {user && <Link to="/profile" style={linkStyle("/profile")} onClick={closeMenu}>Profile</Link>}
          {!user && <Link to="/login" style={linkStyle("/login")} onClick={closeMenu}>Login</Link>}
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="theme-toggle"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
