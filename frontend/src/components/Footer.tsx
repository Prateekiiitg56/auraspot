import { Link } from "react-router-dom";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer>
      <div className="wrap">
        {/* 1. Primary 4-Column Navigation Grid */}
        <div className="footer-primary-grid">
          {/* Column 1: Brand & Mission */}
          <div>
            <Link to="/" className="f-logo" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", marginBottom: "12px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="var(--color-primary)" />
                <circle cx="12" cy="12" r="6" stroke="#FFFFFF" strokeWidth="2.2" />
                <path d="M12 7V17M7 12H17" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: "19px", fontWeight: 700, color: "var(--color-text-main)", letterSpacing: "-0.02em" }}>
                AuraSpot
              </span>
            </Link>
            <p style={{ fontSize: "13.5px", lineHeight: "1.6", color: "var(--color-text-muted)", margin: "0 0 16px" }}>
              AI-powered property scoring, landlord ID verification, and zero-brokerage rental escrow.
            </p>
            <div className="mono" style={{ fontSize: "11px", color: "var(--color-text-caption)" }}>
              Engine Version v2.4 · Live Escrow Active
            </div>
          </div>

          {/* Column 2: City & Locality Shortcuts */}
          <div>
            <div className="footer-col-title">Popular Locality Search</div>
            <div className="footer-link-list">
              <Link to="/explore?search=Guwahati">Flats in Guwahati</Link>
              <Link to="/explore?search=Uzan%20Bazar">PGs in Uzan Bazar</Link>
              <Link to="/explore?search=Zoo%20Road">Hostels near Zoo Road</Link>
              <Link to="/explore?search=Bangalore">Indiranagar Bangalore</Link>
              <Link to="/explore?search=Koramangala">Koramangala</Link>
              <Link to="/explore?search=Delhi">South Delhi</Link>
            </div>
          </div>

          {/* Column 3: Product Links */}
          <div>
            <div className="footer-col-title">Product & Platform</div>
            <div className="footer-link-list">
              <Link to="/explore">Explore Scored Homes</Link>
              <Link to="/ai-match">AI Requirement Match</Link>
              <Link to="/rent-manager">Escrow Rent Manager</Link>
              <Link to="/add-property">Post Verified Listing</Link>
              <Link to="/analytics">Landlord Analytics</Link>
            </div>
          </div>

          {/* Column 4: Market Insights Newsletter Signup */}
          <div>
            <div className="footer-col-title">Weekly Rent Risk Report</div>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "0 0 12px" }}>
              Receive weekly price variance alerts & newly scored 85+ listings in your locality.
            </p>

            {subscribed ? (
              <div className="tag tag-green" style={{ display: "inline-block", padding: "8px 12px", fontSize: "12.5px" }}>
                ✓ Subscribed to weekly market alerts!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="footer-newsletter-form">
                <input
                  type="email"
                  placeholder="Enter work email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", fontSize: "13px" }}
                  required
                />
                <button type="submit" className="btn btn-solid" style={{ padding: "8px 14px", fontSize: "13px" }}>
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* 2. Secondary Bottom Legal & Social Bar */}
        <div className="footer-secondary-bar">
          <div>
            © {new Date().getFullYear()} AuraSpot Technologies Inc. All rights reserved.
          </div>

          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <Link to="/explore" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Privacy Policy</Link>
            <Link to="/explore" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Terms of Service</Link>
            <a
              href="https://github.com/prateekiiitg56"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: 600,
                color: "var(--color-primary)",
                textDecoration: "none"
              }}
            >
              <svg height="15" width="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub Developer
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
