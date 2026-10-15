import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UserX, MessageSquareQuote } from "lucide-react";
import { apiFetch } from "../services/api";
import ProfileSummary, { Stars } from "../components/ProfileSummary";
import type { PublicUser, UserStats } from "../components/ProfileSummary";
import PropertyCard from "../components/PropertyCard";
import type { PropertyCardData } from "../components/PropertyCard";

type Review = {
  _id: string;
  rating: number;
  review?: string;
  createdAt: string;
  rater?: { name: string };
  property?: { title: string };
};

/** Public profile: trust signals, live listings and reviews. */
const UserProfile = () => {
  const { email = "" } = useParams<{ email: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [listings, setListings] = useState<PropertyCardData[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const res = await apiFetch(`/users/email/${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error("not found");
        const data: PublicUser = await res.json();
        const [statsRes, listingsRes, reviewsRes] = await Promise.all([
          apiFetch(`/users/stats/${data._id}`),
          apiFetch(`/properties/owner/${data._id}`),
          apiFetch(`/users/ratings/${encodeURIComponent(email)}`)
        ]);
        if (cancelled) return;
        setUser(data);
        setStats(statsRes.ok ? await statsRes.json() : null);
        const all: PropertyCardData[] = listingsRes.ok ? await listingsRes.json() : [];
        setListings(all.filter((p) => p.status === "AVAILABLE").map((p) => ({ ...p, owner: { verified: data.verified } })));
        setReviews(reviewsRes.ok ? await reviewsRes.json() : []);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("missing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  if (status === "loading") {
    return (
      <div className="wrap page-section profile-layout">
        <div className="skeleton" style={{ height: 380 }} />
        <div className="skeleton" style={{ height: 380 }} />
      </div>
    );
  }

  if (status === "missing" || !user) {
    return (
      <div className="wrap page-section">
        <div className="paper-card empty-state">
          <UserX size={36} aria-hidden="true" />
          <h3>User not found</h3>
          <p>This profile does not exist or is no longer available.</p>
          <Link to="/explore" className="btn btn-outline">Browse listings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page-section profile-layout">
      <ProfileSummary user={user} stats={stats} />

      <div className="profile-main stack">
        {user.bio && (
          <section className="paper-card">
            <h2>About</h2>
            <p className="profile-bio">{user.bio}</p>
          </section>
        )}

        <section>
          <h2>Available listings ({listings.length})</h2>
          {listings.length === 0 ? (
            <p className="muted">No listings available right now.</p>
          ) : (
            <div className="property-grid">
              {listings.map((p) => <PropertyCard key={p._id} property={p} />)}
            </div>
          )}
        </section>

        <section className="paper-card">
          <h2 className="inline-icon"><MessageSquareQuote size={20} aria-hidden="true" /> Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="muted">No reviews yet. Reviews can only be left by people who completed a deal with this user.</p>
          ) : (
            <ul className="review-feed">
              {reviews.map((r) => (
                <li key={r._id}>
                  <div className="section-title-row">
                    <strong>{r.rater?.name || "AuraSpot user"}</strong>
                    <Stars value={r.rating} size={14} />
                  </div>
                  {r.review && <p>{r.review}</p>}
                  <span className="muted">
                    {r.property?.title ? `${r.property.title} · ` : ""}
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserProfile;
