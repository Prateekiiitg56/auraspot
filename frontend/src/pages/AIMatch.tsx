import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check, SearchX, MapPin } from "lucide-react";
import { apiJson, formatINR, getPropertyImage, readError } from "../services/api";
import { toast } from "../components/Feedback";

type Breakdown = { location: number; budget: number; propertyType: number; amenities: number; profileMatch: number };
type Match = {
  _id: string;
  title: string;
  price: number;
  city?: string;
  area?: string;
  type: string;
  purpose: string;
  image?: string;
  images?: string[];
  aiScore: { totalScore: number; breakdown: Breakdown; matchReason?: string };
};
type Results = { topMatches: Match[]; budgetFriendly: Match[]; closest: Match[] };

const AMENITIES = ["Wi-Fi", "AC", "Parking", "Security", "Power Backup", "Furnished", "Laundry", "Kitchen", "Balcony", "Gym", "Meals", "Water Supply"];
const PROFILES = [
  { value: "", label: "Prefer not to say" },
  { value: "student", label: "Student" },
  { value: "worker", label: "Working professional" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" }
];
const TABS = [
  { key: "topMatches", label: "Best matches" },
  { key: "budgetFriendly", label: "Best value" },
  { key: "closest", label: "Closest" }
] as const;
const FACTORS: { key: keyof Breakdown; label: string; max: number }[] = [
  { key: "location", label: "Location", max: 30 },
  { key: "budget", label: "Budget", max: 25 },
  { key: "propertyType", label: "Type", max: 15 },
  { key: "amenities", label: "Amenities", max: 15 },
  { key: "profileMatch", label: "Lifestyle", max: 15 }
];

const scoreTone = (score: number) => (score >= 75 ? "var(--verified)" : score >= 55 ? "var(--flag)" : "var(--brick)");

const AIMatch = () => {
  const [location, setLocation] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [purpose, setPurpose] = useState("RENT");
  const [propertyType, setPropertyType] = useState("");
  const [profile, setProfile] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("topMatches");

  const toggle = (a: string) => setAmenities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]));

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax)) {
      toast.error("Minimum budget can’t be higher than the maximum");
      return;
    }
    setLoading(true);
    try {
      const res = await apiJson("/properties/ai-match", "POST", {
        preferredLocation: location.trim(),
        budgetMin: Number(budgetMin) || 0,
        budgetMax: Number(budgetMax) || undefined,
        purpose,
        propertyType,
        userProfile: profile,
        requiredAmenities: amenities
      });
      if (!res.ok) throw new Error(await readError(res, "Matching failed"));
      const data = await res.json();
      setResults(data.suggestions);
      setTab("topMatches");
      requestAnimationFrame(() => document.getElementById("match-results")?.scrollIntoView({ behavior: "smooth" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setLoading(false);
    }
  };

  const list = results?.[tab] || [];

  return (
    <div className="wrap page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Find my match</p>
          <h1>Tell us what you need</h1>
          <p>We rank every available listing against your location, budget and lifestyle — and show why.</p>
        </div>
      </div>

      <form className="paper-card match-form" onSubmit={search}>
        <div className="form-row form-row-3">
          <div className="field">
            <label htmlFor="mt-loc">Preferred area or city</label>
            <input id="mt-loc" type="text" required placeholder="e.g. Koramangala" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mt-purpose">Looking to</label>
            <select id="mt-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option value="RENT">Rent</option>
              <option value="SALE">Buy</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="mt-type">Property type</label>
            <select id="mt-type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
              <option value="">Any</option>
              <option value="FLAT">Flat</option>
              <option value="HOME">House</option>
              <option value="ROOM">Room</option>
              <option value="PG">PG</option>
              <option value="HOSTEL">Hostel</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="mt-min">Min budget (₹)</label>
            <input id="mt-min" type="number" min={0} inputMode="numeric" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mt-max">Max budget (₹)</label>
            <input id="mt-max" type="number" min={0} inputMode="numeric" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mt-profile">I am a</label>
            <select id="mt-profile" value={profile} onChange={(e) => setProfile(e.target.value)}>
              {PROFILES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <fieldset className="chip-group" style={{ marginTop: 4 }}>
          <legend>Must-have amenities</legend>
          <div className="chip-list">
            {AMENITIES.map((a) => {
              const on = amenities.includes(a);
              return (
                <button key={a} type="button" className={`chip ${on ? "selected" : ""}`} aria-pressed={on} onClick={() => toggle(a)}>
                  {on && <Check size={13} aria-hidden="true" />} {a}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="wizard-actions">
          <span className="muted" style={{ fontSize: 13 }}>Scoring is rule-based and transparent — see the breakdown on each result.</span>
          <button type="submit" className="btn btn-solid" disabled={loading || !location.trim()}>
            <Sparkles size={16} aria-hidden="true" /> {loading ? "Finding matches…" : "Find matches"}
          </button>
        </div>
      </form>

      {results && (
        <section id="match-results" className="match-results" aria-live="polite">
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                {t.label} <span className="tab-count">{results[t.key].length}</span>
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="paper-card empty-state">
              <SearchX size={36} aria-hidden="true" />
              <h3>No listings to match yet</h3>
              <p>There are no available listings right now. Try again later or browse everything on Explore.</p>
              <Link to="/explore" className="btn btn-outline">Explore listings</Link>
            </div>
          ) : (
            <ol className="match-list">
              {list.map((m, i) => (
                <li key={m._id} className="paper-card match-card">
                  <Link to={`/property/${m._id}`} className="match-thumb">
                    <img src={getPropertyImage(m)} alt="" loading="lazy" />
                    <span className="match-rank mono">#{i + 1}</span>
                  </Link>
                  <div className="match-body">
                    <div className="section-title-row">
                      <h3><Link to={`/property/${m._id}`}>{m.title}</Link></h3>
                      <span className="ai-score mono" style={{ color: scoreTone(m.aiScore.totalScore) }}>
                        {m.aiScore.totalScore}<small>% match</small>
                      </span>
                    </div>
                    <p className="muted inline-icon" style={{ margin: "2px 0 0", fontSize: 13.5 }}>
                      <MapPin size={13} aria-hidden="true" /> {[m.area, m.city].filter(Boolean).join(", ")} · {m.type}
                    </p>
                    <p className="card-price mono" style={{ margin: "8px 0" }}>
                      {formatINR(m.price)}{m.purpose === "RENT" && <span className="card-price-unit">/month</span>}
                    </p>
                    {m.aiScore.matchReason && <p className="match-reason">{m.aiScore.matchReason}</p>}
                    <ul className="match-factors">
                      {FACTORS.map((f) => (
                        <li key={f.key}>
                          <span>{f.label}</span>
                          <div className="progress-track"><div className="progress-fill" style={{ width: `${(m.aiScore.breakdown[f.key] / f.max) * 100}%`, background: "var(--blueprint)" }} /></div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
};

export default AIMatch;
