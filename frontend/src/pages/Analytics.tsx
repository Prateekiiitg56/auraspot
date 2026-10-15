import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { apiFetch, formatINR, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";

type AnalyticsData = {
  rent: {
    monthlyCollected: number;
    monthlyExpected: number;
    totalCollected: number;
    pendingPayments: number;
    activeAgreements: number;
    monthlyData: Array<{ month: string; amount: number }>;
  };
  maintenance: {
    pending: number;
    approved: number;
    inProgress: number;
    resolved: number;
    total: number;
    avgResolutionDays: number;
  };
  occupancy: {
    total: number;
    occupied: number;
    available: number;
    rate: number;
  };
  requests: { pending: number };
  propertyTypes: Record<string, number>;
};

const TYPE_LABEL: Record<string, string> = { FLAT: "Flats", HOME: "Houses", ROOM: "Rooms", PG: "PGs", HOSTEL: "Hostels" };

const Metric = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="paper-card metric">
    <span className="metric-label">{label}</span>
    <strong className="metric-value mono">{value}</strong>
    {hint && <span className="metric-hint">{hint}</span>}
  </div>
);

const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    apiFetch(`/analytics/owner/${encodeURIComponent(user.email)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res, "Could not load analytics"));
        return res.json();
      })
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const header = (
    <div className="page-header">
      <div>
        <p className="eyebrow">Owner analytics</p>
        <h1>Portfolio overview</h1>
        <p>Rent collection, occupancy and maintenance across your listings.</p>
      </div>
      <Link to="/rent-manager" className="btn btn-outline">Open rent manager</Link>
    </div>
  );

  if (error) {
    return (
      <div className="wrap page-section">
        {header}
        <div className="paper-card empty-state">
          <h3>Couldn’t load analytics</h3>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="wrap page-section">
        {header}
        <div className="metric-grid">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 104 }} />)}
        </div>
        <div className="skeleton" style={{ height: 280, marginTop: 20 }} />
      </div>
    );
  }

  if (data.occupancy.total === 0) {
    return (
      <div className="wrap page-section">
        {header}
        <div className="paper-card empty-state">
          <BarChart3 size={36} aria-hidden="true" />
          <h3>No listings yet</h3>
          <p>Analytics appear once you list a property and start receiving requests.</p>
          <Link to="/add" className="btn btn-solid">List a property</Link>
        </div>
      </div>
    );
  }

  const { rent, maintenance, occupancy } = data;
  const collectionRate = rent.monthlyExpected ? Math.round((rent.monthlyCollected / rent.monthlyExpected) * 100) : 0;
  const maxMonth = Math.max(...rent.monthlyData.map((m) => m.amount), 1);
  const openMaintenance = maintenance.pending + maintenance.approved + maintenance.inProgress;
  const typeEntries = Object.entries(data.propertyTypes).sort((a, b) => b[1] - a[1]);

  return (
    <div className="wrap page-section">
      {header}

      <div className="metric-grid">
        <Metric
          label="Collected this month"
          value={formatINR(rent.monthlyCollected)}
          hint={rent.monthlyExpected ? `${collectionRate}% of ${formatINR(rent.monthlyExpected)} expected` : "No active agreements"}
        />
        <Metric label="Occupancy" value={`${occupancy.rate}%`} hint={`${occupancy.occupied} of ${occupancy.total} listings occupied`} />
        <Metric label="Overdue payments" value={rent.pendingPayments} hint={`${rent.activeAgreements} active agreements`} />
        <Metric label="Open requests" value={data.requests.pending} hint="Rent / buy requests awaiting your reply" />
      </div>

      <div className="analytics-grid">
        <section className="paper-card">
          <div className="section-title-row">
            <h2>Rent collected</h2>
            <span className="muted">Last 6 months · total {formatINR(rent.totalCollected)}</span>
          </div>
          <div className="bar-chart" role="img" aria-label={rent.monthlyData.map((m) => `${m.month}: ${formatINR(m.amount)}`).join(", ")}>
            {rent.monthlyData.map((m) => (
              <div key={m.month} className="bar-col">
                <span className="bar-value mono">{m.amount ? formatINR(m.amount) : "—"}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${(m.amount / maxMonth) * 100}%` }} />
                </div>
                <span className="bar-label">{m.month}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="paper-card">
          <h2>Maintenance</h2>
          <dl className="kv-list">
            <div><dt>Open requests</dt><dd className="mono">{openMaintenance}</dd></div>
            <div><dt>Resolved</dt><dd className="mono">{maintenance.resolved}</dd></div>
            <div><dt>Average resolution</dt><dd className="mono">{maintenance.resolved ? `${maintenance.avgResolutionDays} days` : "—"}</dd></div>
          </dl>
          <Link to="/maintenance" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>View requests</Link>
        </section>

        <section className="paper-card">
          <h2>Listings by type</h2>
          <ul className="type-bars">
            {typeEntries.map(([type, count]) => (
              <li key={type}>
                <span>{TYPE_LABEL[type] || type}</span>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${(count / occupancy.total) * 100}%`, background: "var(--blueprint)" }} /></div>
                <span className="mono">{count}</span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ margin: "12px 0 0", fontSize: 13 }}>{occupancy.available} available · {occupancy.occupied} rented or sold</p>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
