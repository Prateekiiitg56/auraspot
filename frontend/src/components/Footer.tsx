import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const CITY_LINKS = ["Guwahati", "Bangalore", "Delhi", "Mumbai", "Pune", "Hyderabad"];

const Footer = () => (
  <footer>
    <div className="wrap">
      <div className="footer-primary-grid">
        <div>
          <Link to="/" className="logo footer-logo">
            <Logo />
            <span>AuraSpot</span>
          </Link>
          <p className="footer-blurb">
            Rental and sale listings with transparent pricing scores, owner trust signals and built-in rent tracking.
          </p>
        </div>

        <nav aria-label="Browse by city">
          <div className="footer-col-title">Browse by city</div>
          <div className="footer-link-list">
            {CITY_LINKS.map((city) => (
              <Link key={city} to={`/explore?city=${encodeURIComponent(city)}`}>
                Homes in {city}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Renters">
          <div className="footer-col-title">For renters</div>
          <div className="footer-link-list">
            <Link to="/explore">Explore listings</Link>
            <Link to="/ai-match">Find my match</Link>
            <Link to="/saved">Saved homes</Link>
            <Link to="/my-deals">My rentals</Link>
          </div>
        </nav>

        <nav aria-label="Owners">
          <div className="footer-col-title">For owners</div>
          <div className="footer-link-list">
            <Link to="/add">List a property</Link>
            <Link to="/rent-manager">Rent manager</Link>
            <Link to="/maintenance">Maintenance</Link>
            <Link to="/analytics">Analytics</Link>
          </div>
        </nav>
      </div>

      <div className="footer-secondary-bar">
        <div>© {new Date().getFullYear()} AuraSpot. All rights reserved.</div>
        <div className="footer-meta">
          AI insights are estimates. Always visit a property and verify documents before paying.
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
