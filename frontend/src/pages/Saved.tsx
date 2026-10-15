import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { apiFetch, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";
import type { PropertyCardData } from "../components/PropertyCard";

const Saved = () => {
  const { savedIds } = useAuth();
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/users/me/saved");
        if (!res.ok) throw new Error(await readError(res, "Could not load saved homes"));
        const data = await res.json();
        if (!cancelled) setProperties(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load saved homes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide listings un-saved on this page without refetching
  const visible = useMemo(() => properties.filter((p) => savedIds.has(p._id)), [properties, savedIds]);

  return (
    <div className="wrap page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Your shortlist</p>
          <h1>Saved homes</h1>
          <p>Listings you bookmarked to compare or revisit later.</p>
        </div>
      </div>

      {loading ? (
        <div className="property-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 340 }} />
          ))}
        </div>
      ) : error ? (
        <div className="paper-card empty-state">
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="paper-card empty-state">
          <Heart size={36} aria-hidden="true" />
          <h3>No saved homes yet</h3>
          <p>Tap the heart on any listing to keep it here for later.</p>
          <Link to="/explore" className="btn btn-solid">Explore listings</Link>
        </div>
      ) : (
        <div className="property-grid">
          {visible.map((p) => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Saved;
