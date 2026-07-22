import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../services/api";
import { auth } from "../services/firebase";

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
    requested: number;
    rate: number;
  };
  response: {
    avgResponseHours: number;
    pendingRequests: number;
    totalResponded: number;
  };
  propertyTypes: Record<string, number>;
};

const MONTHLY_TREND_DATA = [
  { month: "Jan", amount: 120000, height: 60 },
  { month: "Feb", amount: 128000, height: 65 },
  { month: "Mar", amount: 135000, height: 72 },
  { month: "Apr", amount: 142000, height: 80 },
  { month: "May", amount: 145000, height: 85 },
  { month: "Jun", amount: 148500, height: 94 }
];

const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"LANDLORD" | "TENANT">("LANDLORD");
  const [activeTab, setActiveTab] = useState("Overview");

  const currentUser = auth.currentUser;

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!currentUser?.email) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API}/analytics/owner/${currentUser.email}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="wrap" style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2>Please login to view dashboard & analytics</h2>
        <Link to="/login" className="btn btn-solid" style={{ marginTop: "16px" }}>Go to Login</Link>
      </div>
    );
  }

  const monthlyCollected = analytics?.rent?.monthlyCollected || 148500;
  const monthlyExpected = analytics?.rent?.monthlyExpected || 158000;
  const collectionRate = Math.round((monthlyCollected / (monthlyExpected || 1)) * 100);

  return (
    <div className="wrap" style={{ padding: "40px 32px" }}>
      {/* Dashboard Top Navigation Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", borderBottom: "1px solid var(--color-border)", paddingBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ marginBottom: "6px" }}>
            {userRole === "LANDLORD" ? "Portfolio Dashboard & Analytics" : "Tenant Lease & Payment Portal"}
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "15px" }}>
            Real-time financial collection, lease metrics, and service health.
          </p>
        </div>

        {/* Differentiated Role Switcher Pill Toggle */}
        <div className="role-switcher-toggle">
          <button
            className={`role-toggle-option ${userRole === "LANDLORD" ? "active" : ""}`}
            onClick={() => setUserRole("LANDLORD")}
          >
            🏠 Landlord View
          </button>
          <button
            className={`role-toggle-option ${userRole === "TENANT" ? "active" : ""}`}
            onClick={() => setUserRole("TENANT")}
          >
            🔑 Tenant View
          </button>
        </div>
      </div>

      {/* System-Aligned Pill Tabs */}
      <div className="system-tabs-container">
        {["Overview", "Revenue Trends", "Maintenance", "Tenant Ledger"].map(tab => (
          <button
            key={tab}
            className={`system-tab-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. ASYMMETRICAL METRIC HIERARCHY (No 4 Equal Stat Cards) */}
      <div className="dashboard-metrics-grid">
        {/* Featured Hero Stat Card (60% Width) */}
        <div className="stat-hero-card">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span className="eyebrow" style={{ margin: 0 }}>Primary Metric</span>
              <span className="tag tag-green mono" style={{ fontSize: "11px" }}>+12.4% vs last month</span>
            </div>
            <div style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
              {userRole === "LANDLORD" ? "Total Monthly Collections" : "Active Monthly Lease Rent"}
            </div>
            <div className="mono" style={{ fontSize: "36px", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "16px" }}>
              ₹{monthlyCollected.toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "var(--color-text-muted)", marginBottom: "6px" }}>
              <span>Collection Target (₹{monthlyExpected.toLocaleString()})</span>
              <span className="mono" style={{ fontWeight: 600, color: "var(--color-success)" }}>{collectionRate}% Collected</span>
            </div>
            <div style={{ height: "8px", borderRadius: "4px", background: "var(--color-bg-subtle)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${collectionRate}%`, background: "var(--color-primary)", borderRadius: "4px" }} />
            </div>
          </div>
        </div>

        {/* Secondary Stat Column (40% Width) */}
        <div className="stat-secondary-stack">
          <div className="stat-compact-card">
            <div>
              <div style={{ fontSize: "12px", color: "var(--color-text-caption)" }}>Occupancy Rate</div>
              <div className="mono" style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-main)" }}>
                {analytics?.occupancy?.rate || 92}%
              </div>
            </div>
            <span className="tag tag-green">High Demand</span>
          </div>

          <div className="stat-compact-card">
            <div>
              <div style={{ fontSize: "12px", color: "var(--color-text-caption)" }}>
                {userRole === "LANDLORD" ? "Active Property Listings" : "Lease Agreement Status"}
              </div>
              <div className="mono" style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-main)" }}>
                {userRole === "LANDLORD" ? `${analytics?.occupancy?.total || 12} Properties` : "Active (Expires in 8 mos)"}
              </div>
            </div>
            <span className="tag tag-amber">{userRole === "LANDLORD" ? "Verified" : "Verified ID"}</span>
          </div>

          <div className="stat-compact-card">
            <div>
              <div style={{ fontSize: "12px", color: "var(--color-text-caption)" }}>Pending Maintenance</div>
              <div className="mono" style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-main)" }}>
                {analytics?.maintenance?.pending || 2} Requests
              </div>
            </div>
            <span className="tag tag-green">Avg 1.2 day SLA</span>
          </div>
        </div>
      </div>

      {/* 2. REVENUE TRENDS BAR CHART VISUALIZATION */}
      {(activeTab === "Overview" || activeTab === "Revenue Trends") && (
        <div className="trend-chart-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "18px", margin: "0 0 4px" }}>6-Month Rent Collection Trend</h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>Monthly verified rent receipts credited directly to escrow</p>
            </div>
            <span className="mono" style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-primary)" }}>H1 2026</span>
          </div>

          <div className="trend-bars-wrapper">
            {MONTHLY_TREND_DATA.map((d, i) => (
              <div key={i} className="trend-bar-col">
                <span className="mono" style={{ fontSize: "11px", color: "var(--color-text-caption)" }}>₹{(d.amount / 1000).toFixed(0)}k</span>
                <div className="trend-bar-fill-inner" style={{ height: `${d.height}%` }} />
                <span className="mono" style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-main)" }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ROLE-DIFFERENTIATED TABLES & LEDGER */}
      {userRole === "LANDLORD" ? (
        <div className="card">
          <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Tenant Payment Ledger</h3>
          <table>
            <thead>
              <tr>
                <th>Property / Unit</th>
                <th>Tenant Name</th>
                <th>Monthly Rent</th>
                <th>Payment Status</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Riverside Flat #201</b></td>
                <td>Rohan Sharma</td>
                <td className="mono">₹18,500</td>
                <td><span className="tag tag-green">✓ Paid</span></td>
                <td className="mono">1st of Month</td>
                <td><button className="btn btn-outline" style={{ fontSize: "12px", padding: "4px 10px" }}>Receipt</button></td>
              </tr>
              <tr>
                <td><b>Sunrise PG #A4</b></td>
                <td>Aniket Roy</td>
                <td className="mono">₹7,200</td>
                <td><span className="tag tag-green">✓ Paid</span></td>
                <td className="mono">5th of Month</td>
                <td><button className="btn btn-outline" style={{ fontSize: "12px", padding: "4px 10px" }}>Receipt</button></td>
              </tr>
              <tr>
                <td><b>Green Meadows #B</b></td>
                <td>Priya Das</td>
                <td className="mono">₹32,000</td>
                <td><span className="tag tag-amber">⏳ Pending</span></td>
                <td className="mono">25th of Month</td>
                <td><button className="btn btn-solid" style={{ fontSize: "12px", padding: "4px 10px" }}>Remind</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Tenant Active Lease Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ background: "var(--color-bg-subtle)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-caption)", marginBottom: "4px" }}>Active Leased Property</div>
              <div style={{ fontSize: "16px", fontWeight: 650, marginBottom: "8px" }}>2BHK Riverside Flat, Uzan Bazar</div>
              <div className="mono" style={{ fontSize: "18px", color: "var(--color-primary)", fontWeight: 600 }}>₹18,500 / month</div>
            </div>

            <div style={{ background: "var(--color-bg-subtle)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-caption)", marginBottom: "4px" }}>Next Rent Payment</div>
              <div style={{ fontSize: "16px", fontWeight: 650, marginBottom: "8px", color: "var(--color-warning)" }}>Due in 5 Days (27th July)</div>
              <button className="btn btn-solid" style={{ width: "100%" }}>💳 Pay Rent Instant Escrow</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
