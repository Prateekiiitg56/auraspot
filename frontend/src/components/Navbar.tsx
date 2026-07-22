import { Link, useLocation, useNavigate } from "react-router-dom";
import type { User } from "firebase/auth";
import { useTheme } from "../context/ThemeContext";
import { useState, useCallback, useEffect, useRef } from "react";

// Custom AuraSpot Logo Mark Glyph (House inside Aura Compass Ring)
const AuraSpotLogo = () => (
  <svg
    className="logo-icon"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="16"
      cy="16"
      r="13"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeDasharray="4 2 6 2"
      opacity="0.85"
    />
    <path
      d="M16 7L7 14V24C7 24.5523 7.44772 25 8 25H13V18H19V25H24C24.5523 25 25 24.5523 25 24V14L16 7Z"
      fill="currentColor"
    />
  </svg>
);

const CITIES = ["Guwahati", "Bangalore", "Delhi", "Mumbai", "All Cities"];

const Navbar = ({ user }: { user: User | null }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Guwahati");
  const [isScrolled, setIsScrolled] = useState(false);

  const locationMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll listener for header hero overlay -> scrolled solid bar transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside listener for location dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationMenuRef.current && !locationMenuRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setLocationOpen(false);
  }, []);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setLocationOpen(false);
    if (city === "All Cities") {
      navigate("/explore");
    } else {
      navigate(`/explore?city=${encodeURIComponent(city)}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className={isScrolled ? "header-scrolled" : ""}>
        <div className="surface">
          <nav>
            {/* Left: Custom AuraSpot Brand & Logo Mark */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link to="/" className="logo" onClick={closeMenu}>
                <AuraSpotLogo />
                <span>AuraSpot</span>
              </Link>

              {/* Location Switcher */}
              <div className="location-switcher" ref={locationMenuRef}>
                <button
                  className="location-picker-btn"
                  onClick={() => setLocationOpen(!locationOpen)}
                  aria-label="Select location"
                  title="Switch city"
                >
                  <span style={{ fontSize: "12px" }}>📍</span>
                  <span>{selectedCity}</span>
                  <span style={{ fontSize: "10px", opacity: 0.6 }}>▾</span>
                </button>

                {locationOpen && (
                  <div className="location-dropdown-menu">
                    <div style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--color-text-caption)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      Select Location
                    </div>
                    {CITIES.map(city => (
                      <button
                        key={city}
                        className={`location-option ${selectedCity === city ? "selected" : ""}`}
                        onClick={() => handleSelectCity(city)}
                      >
                        <span>{city}</span>
                        {selectedCity === city && <span style={{ fontSize: "12px" }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="nav-links">
              <Link
                to="/"
                className={`nav-item ${isActive("/") ? "active" : ""}`}
                onClick={closeMenu}
              >
                Explore homes
              </Link>
              <Link
                to="/explore"
                className={`nav-item ${isActive("/explore") ? "active" : ""}`}
                onClick={closeMenu}
              >
                Explore
              </Link>
              <Link
                to="/ai-match"
                className={`nav-item ${isActive("/ai-match") ? "active" : ""}`}
                onClick={closeMenu}
              >
                AI Match <span className="pill-new">new</span>
              </Link>
              {user && (
                <Link
                  to="/rent-manager"
                  className={`nav-item ${isActive("/rent-manager") ? "active" : ""}`}
                  onClick={closeMenu}
                >
                  Rent manager
                </Link>
              )}
              {user && (
                <Link
                  to="/maintenance"
                  className={`nav-item ${isActive("/maintenance") ? "active" : ""}`}
                  onClick={closeMenu}
                >
                  Maintenance
                </Link>
              )}
              {user && (
                <Link
                  to="/analytics"
                  className={`nav-item ${isActive("/analytics") ? "active" : ""}`}
                  onClick={closeMenu}
                >
                  Analytics
                </Link>
              )}
            </div>

            {/* Right Action Bar - Clear CTA Hierarchy */}
            <div className="nav-right">
              <button
                onClick={toggleDarkMode}
                className="theme-toggle-btn"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              {user ? (
                <>
                  <Link
                    to="/add"
                    className="btn btn-solid"
                    onClick={closeMenu}
                  >
                    ➕ Post Listing
                  </Link>
                  <Link
                    to="/profile"
                    className="btn btn-ghost"
                    onClick={closeMenu}
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-ghost"
                    onClick={closeMenu}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-solid"
                    onClick={closeMenu}
                  >
                    Get Started
                  </Link>
                </>
              )}

              {/* Mobile Drawer Hamburger Icon */}
              <button
                className="nav-hamburger"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation menu"
              >
                ☰
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Slide-In Right Drawer */}
      {menuOpen && (
        <>
          <div className="mobile-drawer-backdrop" onClick={closeMenu} />
          <div className="mobile-drawer-panel">
            <div className="mobile-drawer-header">
              <Link to="/" className="logo" onClick={closeMenu}>
                <AuraSpotLogo />
                <span>AuraSpot</span>
              </Link>
              <button className="mobile-drawer-close" onClick={closeMenu}>
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-caption)", textTransform: "uppercase" }}>
                Navigation
              </div>
              <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`} onClick={closeMenu}>
                Explore homes
              </Link>
              <Link to="/explore" className={`nav-item ${isActive("/explore") ? "active" : ""}`} onClick={closeMenu}>
                Explore
              </Link>
              <Link to="/ai-match" className={`nav-item ${isActive("/ai-match") ? "active" : ""}`} onClick={closeMenu}>
                AI Match <span className="pill-new">new</span>
              </Link>
              {user && (
                <Link to="/rent-manager" className={`nav-item ${isActive("/rent-manager") ? "active" : ""}`} onClick={closeMenu}>
                  Rent manager
                </Link>
              )}
              {user && (
                <Link to="/maintenance" className={`nav-item ${isActive("/maintenance") ? "active" : ""}`} onClick={closeMenu}>
                  Maintenance
                </Link>
              )}
              {user && (
                <Link to="/analytics" className={`nav-item ${isActive("/analytics") ? "active" : ""}`} onClick={closeMenu}>
                  Analytics
                </Link>
              )}
              <Link to="/notifications" className={`nav-item ${isActive("/notifications") ? "active" : ""}`} onClick={closeMenu}>
                Notifications
              </Link>
            </div>

            <div style={{ paddingTop: "20px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "10px" }}>
              {user ? (
                <>
                  <Link to="/add" className="btn btn-solid" style={{ width: "100%" }} onClick={closeMenu}>
                    ➕ Post Listing
                  </Link>
                  <Link to="/profile" className="btn btn-outline" style={{ width: "100%" }} onClick={closeMenu}>
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-solid" style={{ width: "100%" }} onClick={closeMenu}>
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline" style={{ width: "100%" }} onClick={closeMenu}>
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
