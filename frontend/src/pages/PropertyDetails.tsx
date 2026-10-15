import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  BedDouble,
  Ruler,
  Sofa,
  Building2,
  Eye,
  Send,
  MessageSquare,
  CheckCircle2,
  Pencil,
  Trash2,
  Wrench,
  Share2,
  BadgeCheck,
  Star,
  Home
} from "lucide-react";
import { apiFetch, apiJson, formatINR, getImageUrl, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MapDisplay from "../components/MapDisplay";
import SaveButton from "../components/SaveButton";
import { AIInsightsPanel, FraudRiskBadge, AIChatBox } from "../components/AIComponents";
import { MaintenanceRequestForm } from "../components/maintenance";
import { categoryOf, statusOf } from "../components/maintenanceMeta";
import { toast, confirmDialog } from "../components/Feedback";

type Person = {
  _id: string;
  name: string;
  email: string;
  verified?: boolean;
  rating?: number;
  totalRatings?: number;
  successfulDeals?: number;
  trustBadge?: string;
  phoneVerified?: boolean;
};

type Property = {
  _id: string;
  title: string;
  price: number;
  city: string;
  area?: string;
  type: string;
  purpose: "RENT" | "SALE";
  description?: string;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  image?: string;
  images?: string[];
  status: string;
  bhk?: number;
  sqft?: number;
  furnishing?: string;
  owner?: Person;
  assignedTo?: Person | null;
  propertyScore?: number;
  viewCount?: number;
  contactRequests?: number;
  createdAt?: string;
  scoreBreakdown?: Record<"location" | "priceFairness" | "amenities" | "demand" | "ownerCredibility", number>;
};

type MaintenanceItem = { _id: string; title: string; category: string; status: string; createdAt: string };

const TYPE_LABEL: Record<string, string> = { ROOM: "Room", PG: "PG", HOSTEL: "Hostel", FLAT: "Flat / Apartment", HOME: "Independent house" };

const BREAKDOWN = [
  { key: "location", label: "Location", max: 25 },
  { key: "priceFairness", label: "Price fairness", max: 25 },
  { key: "amenities", label: "Amenities", max: 20 },
  { key: "demand", label: "Demand", max: 15 },
  { key: "ownerCredibility", label: "Owner credibility", max: 15 }
] as const;

const scoreTone = (score: number) => (score >= 75 ? "var(--verified)" : score >= 55 ? "var(--flag)" : "var(--brick)");

const PropertyDetails = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [imageIndex, setImageIndex] = useState(0);
  const [hasRequested, setHasRequested] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [showMaintenance, setShowMaintenance] = useState(false);

  const isOwner = !!user?.email && property?.owner?.email === user.email;
  const isTenant = !!user?.email && property?.assignedTo?.email === user.email;

  const loadMaintenance = useCallback(async () => {
    const res = await apiFetch(`/maintenance/property/${id}`);
    if (res.ok) setMaintenance(await res.json());
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      setImageIndex(0);
      try {
        const res = await apiFetch(`/properties/${id}`);
        if (!res.ok) throw new Error();
        const data: Property = await res.json();
        if (cancelled) return;
        setProperty(data);
        setStatus("ready");
        document.title = `${data.title} · AuraSpot`;
      } catch {
        if (!cancelled) setStatus("missing");
      }
    })();
    return () => {
      cancelled = true;
      document.title = "AuraSpot — Find homes you can trust";
    };
  }, [id]);

  // Signed-in extras: request status and maintenance for the tenant
  useEffect(() => {
    if (!user?.email || !property) return;
    if (property.owner?.email !== user.email) {
      apiFetch(`/notifications/check-request/${property._id}/${encodeURIComponent(user.email)}`)
        .then((res) => (res.ok ? res.json() : { hasRequested: false }))
        .then((d) => setHasRequested(!!d.hasRequested))
        .catch(() => undefined);
    }
    if (property.assignedTo?.email === user.email) loadMaintenance().catch(() => undefined);
  }, [user?.email, property, loadMaintenance]);

  if (status === "loading") {
    return (
      <div className="wrap page-section">
        <div className="skeleton" style={{ height: 420, marginBottom: 24 }} />
        <div className="details-layout">
          <div className="skeleton" style={{ height: 300 }} />
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  if (status === "missing" || !property) {
    return (
      <div className="wrap page-section">
        <div className="paper-card empty-state">
          <Home size={36} aria-hidden="true" />
          <h3>Listing not found</h3>
          <p>This property may have been removed by its owner.</p>
          <Link to="/explore" className="btn btn-solid">Browse listings</Link>
        </div>
      </div>
    );
  }

  const images = property.images?.length ? property.images : property.image ? [property.image] : [];
  const unavailable = property.status === "BOOKED" || property.status === "SOLD";
  const location = [property.area, property.city].filter(Boolean).join(", ");
  const score = property.propertyScore || 0;

  const sendRequest = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/property/${property._id}` } });
      return;
    }
    setSending(true);
    try {
      const res = await apiJson(`/properties/${property._id}/request`, "POST", { message: message.trim() });
      if (!res.ok) throw new Error(await readError(res, "Could not send your request"));
      setHasRequested(true);
      setMessage("");
      toast.success("Request sent. You’ll be notified when the owner responds.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your request");
    } finally {
      setSending(false);
    }
  };

  const deleteListing = async () => {
    const ok = await confirmDialog("Delete this listing?", {
      message: "Photos, messages and pending requests will be permanently removed.",
      confirmLabel: "Delete listing",
      danger: true
    });
    if (!ok) return;
    const res = await apiFetch(`/properties/${property._id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readError(res, "Could not delete the listing"));
      return;
    }
    toast.success("Listing deleted");
    navigate("/my-deals");
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: property.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // user cancelled share sheet
    }
  };

  const facts = [
    { icon: Building2, label: TYPE_LABEL[property.type] || property.type },
    property.bhk ? { icon: BedDouble, label: `${property.bhk} BHK` } : null,
    property.sqft ? { icon: Ruler, label: `${property.sqft.toLocaleString("en-IN")} sq ft` } : null,
    property.furnishing ? { icon: Sofa, label: property.furnishing } : null
  ].filter(Boolean) as { icon: typeof Building2; label: string }[];

  return (
    <div className="wrap page-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/explore">Explore</Link>
        <span aria-hidden="true">/</span>
        {property.city && <Link to={`/explore?city=${encodeURIComponent(property.city)}`}>{property.city}</Link>}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{property.title}</span>
      </nav>

      <div className="gallery">
        <img src={getImageUrl(images[imageIndex])} alt={`${property.title} — photo ${imageIndex + 1} of ${Math.max(images.length, 1)}`} className="gallery-main" />
        {images.length > 1 && (
          <>
            <button className="gallery-nav prev" onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)} aria-label="Previous photo">
              <ChevronLeft size={20} />
            </button>
            <button className="gallery-nav next" onClick={() => setImageIndex((i) => (i + 1) % images.length)} aria-label="Next photo">
              <ChevronRight size={20} />
            </button>
            <span className="img-chip mono">{imageIndex + 1} / {images.length}</span>
          </>
        )}
        {unavailable && <span className="img-chip img-chip-status" style={{ top: 12, bottom: "auto" }}>{property.status === "SOLD" ? "Sold" : "Rented"}</span>}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, i) => (
            <button key={img} className={i === imageIndex ? "active" : ""} onClick={() => setImageIndex(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === imageIndex}>
              <img src={getImageUrl(img)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="details-layout">
        <div className="stack">
          <header className="details-header">
            <div>
              <h1>{property.title}</h1>
              {location && <p className="muted inline-icon"><MapPin size={15} aria-hidden="true" /> {location}</p>}
            </div>
            <div className="details-header-actions">
              <button className="icon-btn" onClick={share} aria-label="Share listing"><Share2 size={18} /></button>
              <SaveButton propertyId={property._id} className="icon-btn save-inline" />
            </div>
          </header>

          <ul className="fact-chips">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="chip"><Icon size={15} aria-hidden="true" /> {label}</li>
            ))}
            <li className="chip"><Eye size={15} aria-hidden="true" /> {property.viewCount || 0} views</li>
          </ul>

          <FraudRiskBadge propertyId={property._id} />

          <section className="paper-card">
            <h2>About this home</h2>
            <p className="profile-bio">{property.description || "The owner hasn’t added a description yet."}</p>
            {!!property.amenities?.length && (
              <>
                <h3 className="subheading">Amenities</h3>
                <ul className="amenity-list">
                  {property.amenities.map((a) => (
                    <li key={a}><CheckCircle2 size={15} aria-hidden="true" /> {a}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {score > 0 && property.scoreBreakdown && (
            <section className="paper-card">
              <div className="section-title-row">
                <h2>AuraSpot score</h2>
                <span className="ai-score mono" style={{ color: scoreTone(score) }}>{score}<small>/100</small></span>
              </div>
              <ul className="breakdown">
                {BREAKDOWN.map(({ key, label, max }) => {
                  const value = property.scoreBreakdown?.[key] || 0;
                  return (
                    <li key={key}>
                      <span>{label}</span>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${(value / max) * 100}%`, background: "var(--blueprint)" }} /></div>
                      <span className="mono">{value}/{max}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="ai-disclaimer">Calculated from city price benchmarks, amenities, listing demand and the owner’s verification and track record.</p>
            </section>
          )}

          <AIInsightsPanel propertyId={property._id} />

          <section className="paper-card">
            <h2>Location</h2>
            <MapDisplay latitude={property.latitude} longitude={property.longitude} title={property.title} subtitle={location} />
          </section>

          {isTenant && (
            <section className="paper-card">
              <div className="section-title-row">
                <h2 className="inline-icon"><Wrench size={18} aria-hidden="true" /> Maintenance</h2>
                <button className="btn btn-solid btn-sm" onClick={() => setShowMaintenance(true)}>Report an issue</button>
              </div>
              {maintenance.length === 0 ? (
                <p className="muted">No requests yet.</p>
              ) : (
                <ul className="kv-list" style={{ listStyle: "none", padding: 0 }}>
                  {maintenance.slice(0, 5).map((m) => (
                    <li key={m._id} className="section-title-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--paper-line)" }}>
                      <span>{m.title} <span className="muted">· {categoryOf(m.category).label}</span></span>
                      <span className={`status-pill ${statusOf(m.status).tone}`}>{statusOf(m.status).label}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/maintenance" className="text-link" style={{ display: "inline-block", marginTop: 12 }}>View all requests</Link>
            </section>
          )}
        </div>

        <aside className="details-aside">
          <div className="paper-card action-card">
            <p className="action-price mono">
              {formatINR(property.price)}
              {property.purpose === "RENT" && <span>/month</span>}
            </p>
            <p className="muted" style={{ margin: "0 0 16px" }}>
              {property.purpose === "RENT" ? "For rent" : "For sale"} · No brokerage
            </p>

            {isOwner ? (
              <div className="stack" style={{ gap: 8 }}>
                <p className="status-pill status-info" style={{ alignSelf: "flex-start" }}>This is your listing</p>
                <Link to="/my-deals" className="btn btn-outline btn-block"><Pencil size={15} aria-hidden="true" /> Edit in My listings</Link>
                <Link to={`/chat/${property._id}`} className="btn btn-outline btn-block"><MessageSquare size={15} aria-hidden="true" /> Conversations</Link>
                <Link to="/notifications" className="btn btn-outline btn-block">Review requests</Link>
                <button className="btn btn-ghost btn-block btn-text-danger" onClick={deleteListing}><Trash2 size={15} aria-hidden="true" /> Delete listing</button>
              </div>
            ) : isTenant ? (
              <div className="stack" style={{ gap: 8 }}>
                <p className="status-pill status-ok" style={{ alignSelf: "flex-start" }}>You {property.purpose === "SALE" ? "bought" : "rent"} this home</p>
                {property.purpose === "RENT" && <Link to="/rent-manager" className="btn btn-solid btn-block">Rent & payments</Link>}
                <Link to={`/chat/${property._id}`} className="btn btn-outline btn-block"><MessageSquare size={15} aria-hidden="true" /> Message owner</Link>
              </div>
            ) : unavailable ? (
              <p className="form-error" style={{ margin: 0 }}>This home is no longer available.</p>
            ) : hasRequested ? (
              <div className="stack" style={{ gap: 8 }}>
                <p className="status-pill status-ok inline-icon" style={{ alignSelf: "flex-start" }}><CheckCircle2 size={14} aria-hidden="true" /> Request sent</p>
                <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>The owner will review it and you’ll get a notification.</p>
                <Link to={`/chat/${property._id}`} className="btn btn-outline btn-block"><MessageSquare size={15} aria-hidden="true" /> Message owner</Link>
              </div>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                <label htmlFor="req-msg" className="visually-hidden">Message to the owner</label>
                <textarea
                  id="req-msg"
                  rows={3}
                  maxLength={1000}
                  placeholder={`Hi, I’m interested in ${property.purpose === "RENT" ? "renting" : "buying"} this home. When can I visit?`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button className="btn btn-solid btn-block" onClick={sendRequest} disabled={sending}>
                  <Send size={15} aria-hidden="true" /> {sending ? "Sending…" : property.purpose === "RENT" ? "Request to rent" : "Request to buy"}
                </button>
                {user ? (
                  <Link to={`/chat/${property._id}`} className="btn btn-outline btn-block"><MessageSquare size={15} aria-hidden="true" /> Ask a question</Link>
                ) : (
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>You’ll be asked to sign in first.</p>
                )}
              </div>
            )}
          </div>

          {property.owner && (
            <div className="paper-card owner-card">
              <div className="owner-row">
                <span className="profile-avatar small" aria-hidden="true">{(property.owner.name || "?").charAt(0).toUpperCase()}</span>
                <div>
                  <Link to={`/user/${encodeURIComponent(property.owner.email)}`} className="owner-name">
                    {property.owner.name}
                    {property.owner.verified && <BadgeCheck size={16} className="verified-icon" aria-label="Verified owner" />}
                  </Link>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {property.owner.totalRatings ? (
                      <span className="inline-icon"><Star size={13} aria-hidden="true" /> {property.owner.rating?.toFixed(1)} ({property.owner.totalRatings})</span>
                    ) : "No reviews yet"}
                    {" · "}{property.owner.successfulDeals || 0} deals
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isOwner && <AIChatBox propertyId={property._id} />}
        </aside>
      </div>

      {showMaintenance && (
        <div className="modal-backdrop" onClick={() => setShowMaintenance(false)}>
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="mreq-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="mreq-title" className="modal-title">Report an issue</h3>
            <MaintenanceRequestForm
              properties={[{ _id: property._id, title: property.title }]}
              onCancel={() => setShowMaintenance(false)}
              onCreated={() => {
                setShowMaintenance(false);
                loadMaintenance();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
