import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { signOut } from "firebase/auth";
import {
  Bell,
  MessageSquare,
  Moon,
  Sun,
  Menu,
  X,
  Plus,
  MapPin,
  ChevronDown,
  Check,
  User as UserIcon,
  Heart,
  KeyRound,
  Wallet,
  Wrench,
  BarChart3,
  LogOut
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { auth } from "../services/firebase";
import { apiFetch } from "../services/api";
import { Logo } from "./Logo";

const CITIES = ["All cities", "Guwahati", "Bangalore", "Delhi", "Mumbai", "Pune", "Hyderabad"];

const PRIMARY_LINKS = [
  { to: "/explore", label: "Explore" },
  { to: "/ai-match", label: "Find my match" }
];

const ACCOUNT_LINKS = [
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/saved", label: "Saved homes", icon: Heart },
  { to: "/my-deals", label: "My listings & deals", icon: KeyRound },
  { to: "/rent-manager", label: "Rent manager", icon: Wallet },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];

/** Closes a popover when clicking outside it or pressing Escape. */
const useDismiss = (ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) => {
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, close]);
};

const Badge = ({ count }: { count: number }) =>
  count > 0 ? <span className="count-badge" aria-hidden="true">{count > 9 ? "9+" : count}</span> : null;

const IconLink = ({ to, label, count, children }: { to: string; label: string; count: number; children: ReactNode }) => (
  <Link to={to} className="icon-btn nav-icon-link" aria-label={count ? `${label} (${count} unread)` : label} title={label}>
    {children}
    <Badge count={count} />
  </Link>
);

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unread, setUnread] = useState({ notifications: 0, messages: 0 });

  const cityRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  useDismiss(cityRef, cityOpen, () => setCityOpen(false));
  useDismiss(accountRef, accountOpen, () => setAccountOpen(false));

  const selectedCity = new URLSearchParams(location.search).get("city") || "All cities";

  // Close menus on navigation (state adjusted during render, no effect needed)
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
    setAccountOpen(false);
    setCityOpen(false);
  }

  // Lock page scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Poll unread counts while signed in; refresh on navigation
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [n, m] = await Promise.all([apiFetch("/notifications/unread-count"), apiFetch("/chat/unread-count")]);
        const notifications = n.ok ? (await n.json()).count : 0;
        const messages = m.ok ? (await m.json()).unreadCount : 0;
        if (!cancelled) setUnread({ notifications, messages });
      } catch {
        // Badge is best-effort
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [profile, location.pathname]);

  const selectCity = (city: string) => {
    setCityOpen(false);
    navigate(city === "All cities" ? "/explore" : `/explore?city=${encodeURIComponent(city)}`);
  };

  const logout = async () => {
    setAccountOpen(false);
    setMenuOpen(false);
    await signOut(auth);
    navigate("/");
  };

  const displayName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "";
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const notifCount = profile ? unread.notifications : 0;
  const msgCount = profile ? unread.messages : 0;

  return (
    <>
      <header>
        <div className="surface">
          <nav aria-label="Main">
            <div className="nav-left">
              <Link to="/" className="logo" aria-label="AuraSpot home">
                <Logo />
                <span>AuraSpot</span>
              </Link>

              <div className="location-switcher" ref={cityRef}>
                <button
                  className="location-picker-btn"
                  onClick={() => setCityOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={cityOpen}
                  aria-label={`City: ${selectedCity}. Change city`}
                >
                  <MapPin size={14} aria-hidden="true" />
                  <span>{selectedCity}</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>

                {cityOpen && (
                  <div className="location-dropdown-menu" role="listbox" aria-label="Choose a city">
                    {CITIES.map((city) => (
                      <button
                        key={city}
                        role="option"
                        aria-selected={selectedCity === city}
                        className={`location-option ${selectedCity === city ? "selected" : ""}`}
                        onClick={() => selectCity(city)}
                      >
                        <span>{city}</span>
                        {selectedCity === city && <Check size={14} aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="nav-links">
              {PRIMARY_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                  {l.label}
                </NavLink>
              ))}
              {user && (
                <NavLink to="/rent-manager" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                  Rent manager
                </NavLink>
              )}
            </div>

            <div className="nav-right">
              <button
                onClick={toggleDarkMode}
                className="icon-btn"
                aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
                title={darkMode ? "Light theme" : "Dark theme"}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {user ? (
                <>
                  <IconLink to="/messages" label="Messages" count={msgCount}>
                    <MessageSquare size={18} />
                  </IconLink>
                  <IconLink to="/notifications" label="Notifications" count={notifCount}>
                    <Bell size={18} />
                  </IconLink>

                  <Link to="/add" className="btn btn-solid nav-cta">
                    <Plus size={16} aria-hidden="true" />
                    <span>List property</span>
                  </Link>

                  <div className="account-menu" ref={accountRef}>
                    <button
                      className="avatar-btn"
                      onClick={() => setAccountOpen((o) => !o)}
                      aria-haspopup="menu"
                      aria-expanded={accountOpen}
                      aria-label="Account menu"
                    >
                      {initial}
                    </button>
                    {accountOpen && (
                      <div className="dropdown-menu" role="menu">
                        <div className="dropdown-header">
                          <strong>{displayName}</strong>
                          <span>{user.email}</span>
                        </div>
                        {ACCOUNT_LINKS.map(({ to, label, icon: Icon }) => (
                          <Link key={to} to={to} role="menuitem" className="dropdown-item">
                            <Icon size={16} aria-hidden="true" />
                            {label}
                          </Link>
                        ))}
                        <button role="menuitem" className="dropdown-item danger" onClick={logout}>
                          <LogOut size={16} aria-hidden="true" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost nav-auth-link">Log in</Link>
                  <Link to="/signup" className="btn btn-solid nav-auth-link">Sign up</Link>
                </>
              )}

              <button className="icon-btn nav-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="mobile-drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="mobile-drawer-header">
              <Link to="/" className="logo">
                <Logo />
                <span>AuraSpot</span>
              </Link>
              <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <div className="drawer-section">
              {PRIMARY_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                  {l.label}
                </NavLink>
              ))}
              {user && (
                <>
                  <NavLink to="/messages" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                    Messages <Badge count={msgCount} />
                  </NavLink>
                  <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                    Notifications <Badge count={notifCount} />
                  </NavLink>
                  {ACCOUNT_LINKS.map(({ to, label }) => (
                    <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                      {label}
                    </NavLink>
                  ))}
                </>
              )}
            </div>

            <div className="drawer-footer">
              {user ? (
                <>
                  <Link to="/add" className="btn btn-solid btn-block">
                    <Plus size={16} aria-hidden="true" /> List property
                  </Link>
                  <button className="btn btn-outline btn-block" onClick={logout}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-solid btn-block">Sign up</Link>
                  <Link to="/login" className="btn btn-outline btn-block">Log in</Link>
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
