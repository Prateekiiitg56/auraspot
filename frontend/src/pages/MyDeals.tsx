import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Building2, KeyRound, Pencil, Trash2, Star, Plus, Eye } from "lucide-react";
import { apiFetch, apiJson, formatINR, getPropertyImage, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast, confirmDialog } from "../components/Feedback";

type Property = {
  _id: string;
  title: string;
  price: number;
  city: string;
  area?: string;
  image?: string;
  images?: string[];
  status: string;
  purpose: string;
  type: string;
  description?: string;
  amenities?: string[];
  bhk?: number;
  sqft?: number;
  furnishing?: string;
  viewCount?: number;
  contactRequests?: number;
  owner?: { _id: string; name: string; email: string };
  assignedTo?: { _id: string; name: string; email: string } | null;
};

type RatingState = Record<string, { hasRated: boolean; rating: number }>;

type EditForm = {
  title: string;
  type: string;
  purpose: string;
  price: string;
  city: string;
  area: string;
  description: string;
  amenities: string;
  bhk: string;
  sqft: string;
  furnishing: string;
};

const STATUS: Record<string, { label: string; tone: string }> = {
  AVAILABLE: { label: "Live", tone: "status-ok" },
  REQUESTED: { label: "Requested", tone: "status-warn" },
  BOOKED: { label: "Rented", tone: "status-info" },
  SOLD: { label: "Sold", tone: "status-neutral" }
};

const toForm = (p: Property): EditForm => ({
  title: p.title || "",
  type: p.type || "FLAT",
  purpose: p.purpose || "RENT",
  price: String(p.price || ""),
  city: p.city || "",
  area: p.area || "",
  description: p.description || "",
  amenities: p.amenities?.join(", ") || "",
  bhk: p.bhk ? String(p.bhk) : "",
  sqft: p.sqft ? String(p.sqft) : "",
  furnishing: p.furnishing || "Unfurnished"
});

const MyDeals = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"listings" | "deals">("listings");
  const [listed, setListed] = useState<Property[]>([]);
  const [deals, setDeals] = useState<Property[]>([]);
  const [ratings, setRatings] = useState<RatingState>({});
  const [loading, setLoading] = useState(true);

  const [rateTarget, setRateTarget] = useState<Property | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!profile?._id) return;
    try {
      const [listedRes, dealsRes] = await Promise.all([
        apiFetch(`/properties/owner/${profile._id}`),
        apiFetch("/properties/mine/deals")
      ]);
      const listedData: Property[] = listedRes.ok ? await listedRes.json() : [];
      const dealData: Property[] = dealsRes.ok ? await dealsRes.json() : [];
      setListed(listedData);
      setDeals(dealData);

      const checks = await Promise.all(
        dealData
          .filter((d) => d.owner?.email)
          .map(async (d) => {
            const res = await apiFetch(`/users/rating/check?rateeEmail=${encodeURIComponent(d.owner!.email)}&propertyId=${d._id}`);
            const data = res.ok ? await res.json() : { hasRated: false };
            return [d._id, { hasRated: data.hasRated, rating: data.rating || 0 }] as const;
          })
      );
      setRatings(Object.fromEntries(checks));
    } catch {
      toast.error("Could not load your listings");
    } finally {
      setLoading(false);
    }
  }, [profile?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const submitRating = async (e: FormEvent) => {
    e.preventDefault();
    if (!rateTarget?.owner || ratingValue === 0) return;
    setSubmittingRating(true);
    try {
      const res = await apiJson("/users/rate", "POST", {
        rateeEmail: rateTarget.owner.email,
        rating: ratingValue,
        propertyId: rateTarget._id,
        review
      });
      if (!res.ok) throw new Error(await readError(res, "Could not submit your review"));
      setRatings((r) => ({ ...r, [rateTarget._id]: { hasRated: true, rating: ratingValue } }));
      setRateTarget(null);
      toast.success("Thanks — your review was published");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your review");
    } finally {
      setSubmittingRating(false);
    }
  };

  const deleteListing = async (p: Property) => {
    const ok = await confirmDialog(`Delete “${p.title}”?`, {
      message: "The listing, its photos, messages and requests will be permanently removed.",
      confirmLabel: "Delete listing",
      danger: true
    });
    if (!ok) return;
    const res = await apiFetch(`/properties/${p._id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readError(res, "Could not delete the listing"));
      return;
    }
    setListed((list) => list.filter((x) => x._id !== p._id));
    toast.success("Listing deleted");
  };

  const onEditChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [e.target.name]: e.target.value } : f));

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing || !form) return;
    if (!form.title.trim() || Number(form.price) <= 0) {
      toast.error("Title and a valid price are required");
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      (Object.keys(form) as (keyof EditForm)[]).forEach((k) => data.append(k, form[k]));
      const res = await apiFetch(`/properties/${editing._id}`, { method: "PUT", body: data });
      if (!res.ok) throw new Error(await readError(res, "Could not save changes"));
      const updated: Property = await res.json();
      setListed((list) => list.map((p) => (p._id === updated._id ? { ...p, ...updated, assignedTo: p.assignedTo } : p)));
      setEditing(null);
      toast.success("Listing updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="wrap page-section">
        <div className="skeleton" style={{ height: 90, marginBottom: 24 }} />
        <div className="property-grid">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 300 }} />)}</div>
      </div>
    );
  }

  return (
    <div className="wrap page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">My listings & deals</p>
          <h1>Your properties</h1>
          <p>Manage what you’ve listed and the homes you’ve rented or bought.</p>
        </div>
        <Link to="/add" className="btn btn-solid"><Plus size={16} aria-hidden="true" /> List a property</Link>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "listings"} className={`tab ${tab === "listings" ? "active" : ""}`} onClick={() => setTab("listings")}>
          <Building2 size={16} aria-hidden="true" /> My listings <span className="tab-count">{listed.length}</span>
        </button>
        <button role="tab" aria-selected={tab === "deals"} className={`tab ${tab === "deals" ? "active" : ""}`} onClick={() => setTab("deals")}>
          <KeyRound size={16} aria-hidden="true" /> Rented / bought <span className="tab-count">{deals.length}</span>
        </button>
      </div>

      {tab === "listings" ? (
        listed.length === 0 ? (
          <div className="paper-card empty-state">
            <Building2 size={36} aria-hidden="true" />
            <h3>You haven’t listed anything yet</h3>
            <p>List a room, flat or house and start receiving verified enquiries.</p>
            <Link to="/add" className="btn btn-solid">Create your first listing</Link>
          </div>
        ) : (
          <div className="property-grid">
            {listed.map((p) => {
              const status = STATUS[p.status] || STATUS.AVAILABLE;
              return (
                <article key={p._id} className="paper-card manage-card">
                  <Link to={`/property/${p._id}`} className="manage-card-link">
                    <img src={getPropertyImage(p)} alt="" loading="lazy" />
                    <div className="manage-card-body">
                      <div className="section-title-row">
                        <h3>{p.title}</h3>
                        <span className={`status-pill ${status.tone}`}>{status.label}</span>
                      </div>
                      <p className="card-price mono">
                        {formatINR(p.price)}{p.purpose === "RENT" && <span className="card-price-unit">/month</span>}
                      </p>
                      <p className="muted manage-meta">
                        <Eye size={13} aria-hidden="true" /> {p.viewCount || 0} views · {p.contactRequests || 0} requests
                        {p.assignedTo && ` · ${p.purpose === "SALE" ? "Buyer" : "Tenant"}: ${p.assignedTo.name}`}
                      </p>
                    </div>
                  </Link>
                  <div className="manage-card-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditing(p); setForm(toForm(p)); }}>
                      <Pencil size={14} aria-hidden="true" /> Edit
                    </button>
                    <button className="btn btn-ghost btn-sm btn-text-danger" onClick={() => deleteListing(p)}>
                      <Trash2 size={14} aria-hidden="true" /> Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : deals.length === 0 ? (
        <div className="paper-card empty-state">
          <KeyRound size={36} aria-hidden="true" />
          <h3>No completed deals yet</h3>
          <p>Homes you rent or buy through AuraSpot will appear here.</p>
          <Link to="/explore" className="btn btn-solid">Explore homes</Link>
        </div>
      ) : (
        <div className="property-grid">
          {deals.map((p) => {
            const r = ratings[p._id];
            return (
              <article key={p._id} className="paper-card manage-card">
                <Link to={`/property/${p._id}`} className="manage-card-link">
                  <img src={getPropertyImage(p)} alt="" loading="lazy" />
                  <div className="manage-card-body">
                    <div className="section-title-row">
                      <h3>{p.title}</h3>
                      <span className="status-pill status-info">{p.status === "SOLD" ? "Bought" : "Renting"}</span>
                    </div>
                    <p className="card-price mono">{formatINR(p.price)}{p.purpose === "RENT" && <span className="card-price-unit">/month</span>}</p>
                    <p className="muted manage-meta">Owner: {p.owner?.name || "—"}</p>
                  </div>
                </Link>
                <div className="manage-card-actions">
                  {r?.hasRated ? (
                    <span className="muted inline-icon"><Star size={14} aria-hidden="true" /> You rated {r.rating}/5</span>
                  ) : (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setRateTarget(p);
                        setRatingValue(0);
                        setReview("");
                      }}
                    >
                      <Star size={14} aria-hidden="true" /> Rate owner
                    </button>
                  )}
                  {p.purpose === "RENT" && <Link to="/rent-manager" className="btn btn-ghost btn-sm">Rent & payments</Link>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {rateTarget && (
        <div className="modal-backdrop" onClick={() => setRateTarget(null)}>
          <form className="modal-panel modal-sm" role="dialog" aria-modal="true" aria-labelledby="rate-title" onClick={(e) => e.stopPropagation()} onSubmit={submitRating}>
            <h3 id="rate-title" className="modal-title">Rate {rateTarget.owner?.name}</h3>
            <p className="modal-text">How was your experience with the owner of {rateTarget.title}?</p>
            <div className="star-input" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={ratingValue === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className={(hoverRating || ratingValue) >= n ? "on" : ""}
                  onMouseEnter={() => setHoverRating(n)}
                  onClick={() => setRatingValue(n)}
                >
                  <Star size={28} />
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="review">Review <span className="muted">(optional)</span></label>
              <textarea id="review" rows={3} maxLength={1000} value={review} onChange={(e) => setReview(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setRateTarget(null)}>Cancel</button>
              <button type="submit" className="btn btn-solid" disabled={ratingValue === 0 || submittingRating}>
                {submittingRating ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editing && form && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <form className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="edit-title" onClick={(e) => e.stopPropagation()} onSubmit={saveEdit}>
            <h3 id="edit-title" className="modal-title">Edit listing</h3>
            <div className="field">
              <label htmlFor="e-title">Title</label>
              <input id="e-title" name="title" type="text" maxLength={120} value={form.title} onChange={onEditChange} required />
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="e-type">Type</label>
                <select id="e-type" name="type" value={form.type} onChange={onEditChange}>
                  <option value="FLAT">Flat / Apartment</option>
                  <option value="HOME">Independent house</option>
                  <option value="ROOM">Room</option>
                  <option value="PG">PG</option>
                  <option value="HOSTEL">Hostel</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="e-purpose">Listing for</label>
                <select id="e-purpose" name="purpose" value={form.purpose} onChange={onEditChange}>
                  <option value="RENT">Rent</option>
                  <option value="SALE">Sale</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="e-price">Price (₹)</label>
                <input id="e-price" name="price" type="number" min={1} value={form.price} onChange={onEditChange} required />
              </div>
              <div className="field">
                <label htmlFor="e-furnishing">Furnishing</label>
                <select id="e-furnishing" name="furnishing" value={form.furnishing} onChange={onEditChange}>
                  <option>Unfurnished</option>
                  <option>Semi-Furnished</option>
                  <option>Furnished</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="e-city">City</label>
                <input id="e-city" name="city" type="text" value={form.city} onChange={onEditChange} />
              </div>
              <div className="field">
                <label htmlFor="e-area">Locality</label>
                <input id="e-area" name="area" type="text" value={form.area} onChange={onEditChange} />
              </div>
              <div className="field">
                <label htmlFor="e-bhk">Bedrooms (BHK)</label>
                <input id="e-bhk" name="bhk" type="number" min={1} value={form.bhk} onChange={onEditChange} />
              </div>
              <div className="field">
                <label htmlFor="e-sqft">Area (sq ft)</label>
                <input id="e-sqft" name="sqft" type="number" min={1} value={form.sqft} onChange={onEditChange} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="e-amenities">Amenities (comma separated)</label>
              <input id="e-amenities" name="amenities" type="text" value={form.amenities} onChange={onEditChange} />
            </div>
            <div className="field">
              <label htmlFor="e-description">Description</label>
              <textarea id="e-description" name="description" rows={4} maxLength={3000} value={form.description} onChange={onEditChange} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-solid" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyDeals;
