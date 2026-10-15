import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, SearchX, X } from "lucide-react";
import { apiFetch } from "../services/api";
import PropertyCard from "../components/PropertyCard";
import type { PropertyCardData } from "../components/PropertyCard";

type Property = PropertyCardData & { createdAt?: string; amenities?: string[] };

const TYPES = [
  { value: "", label: "All types" },
  { value: "FLAT", label: "Flats" },
  { value: "HOME", label: "Houses" },
  { value: "ROOM", label: "Rooms" },
  { value: "PG", label: "PG / Hostel" }
];

const SORTS = [
  { value: "", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "score", label: "Highest score" }
];

const scoreOf = (p: Property) => p.aiInsights?.score || p.propertyScore || 0;

const Explore = () => {
  const [params, setParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // All filters live in the URL so results are shareable and the navbar city picker works here too
  const search = params.get("search") || "";
  const city = params.get("city") || "";
  const type = params.get("type") || "";
  const purpose = params.get("purpose") || "";
  const maxPrice = params.get("max") || "";
  const sort = params.get("sort") || "";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    apiFetch("/properties")
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setProperties(Array.isArray(data) ? data : []);
        setError(false);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const cities = useMemo(
    () => Array.from(new Set(properties.map((p) => p.city?.trim()).filter(Boolean) as string[])).sort(),
    [properties]
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = properties.filter((p) => {
      if (q && ![p.title, p.area, p.city].some((f) => f?.toLowerCase().includes(q))) return false;
      if (city && p.city?.toLowerCase() !== city.toLowerCase()) return false;
      if (type === "PG" ? p.type !== "PG" && p.type !== "HOSTEL" : type && p.type !== type) return false;
      if (purpose && p.purpose !== purpose) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "score") sorted.sort((a, b) => scoreOf(b) - scoreOf(a));
    return sorted;
  }, [properties, search, city, type, purpose, maxPrice, sort]);

  const hasFilters = !!(search || city || type || purpose || maxPrice);

  return (
    <div className="wrap page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Explore</p>
          <h1>{city ? `Homes in ${city}` : "Find your next home"}</h1>
          <p>Every listing shows a price-fairness score and owner trust signals.</p>
        </div>
        <Link to="/add" className="btn btn-solid">
          <Plus size={16} aria-hidden="true" /> List a property
        </Link>
      </div>

      <section className="paper-card filter-bar" aria-label="Filters">
        <div className="filter-grid">
          <div className="filter-search">
            <label htmlFor="f-search">Locality or title</label>
            <div className="input-with-icon">
              <Search size={16} aria-hidden="true" />
              <input
                id="f-search"
                type="text"
                placeholder="e.g. Koramangala, Zoo Road"
                value={search}
                onChange={(e) => setParam("search", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="f-city">City</label>
            <select id="f-city" value={city} onChange={(e) => setParam("city", e.target.value)}>
              <option value="">All cities</option>
              {(city && !cities.includes(city) ? [city, ...cities] : cities).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-type">Type</label>
            <select id="f-type" value={type} onChange={(e) => setParam("type", e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-purpose">Purpose</label>
            <select id="f-purpose" value={purpose} onChange={(e) => setParam("purpose", e.target.value)}>
              <option value="">Rent or buy</option>
              <option value="RENT">For rent</option>
              <option value="SALE">For sale</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-max">Max budget (₹)</label>
            <input
              id="f-max"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => setParam("max", e.target.value)}
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="property-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton" style={{ height: 340 }} />
          ))}
        </div>
      ) : error ? (
        <div className="paper-card empty-state">
          <h3>Couldn’t load listings</h3>
          <p>Check your connection and try again.</p>
          <button className="btn btn-outline" onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="results-bar">
            <p className="results-count" aria-live="polite">
              {results.length} {results.length === 1 ? "listing" : "listings"}
              {hasFilters && (
                <button type="button" className="link-btn inline-icon" onClick={() => setParams(new URLSearchParams(sort ? { sort } : {}))}>
                  <X size={14} aria-hidden="true" /> Clear filters
                </button>
              )}
            </p>
            <div className="sort-control">
              <label htmlFor="f-sort">Sort by</label>
              <select id="f-sort" value={sort} onChange={(e) => setParam("sort", e.target.value)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="paper-card empty-state">
              <SearchX size={36} aria-hidden="true" />
              <h3>No listings match these filters</h3>
              <p>Try a different locality, widen your budget, or clear the filters.</p>
              {hasFilters && (
                <button className="btn btn-outline" onClick={() => setParams(new URLSearchParams())}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="property-grid">
              {results.map((p) => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
