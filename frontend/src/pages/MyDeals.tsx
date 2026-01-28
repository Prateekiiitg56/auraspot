import { useEffect, useState } from "react";
import { API } from "../services/api";
import { auth } from "../services/firebase";
import { Link } from "react-router-dom";

type Property = {
  _id: string;
  title: string;
  price: number;
  city: string;
  area: string;
  image?: string;
  status: string;
  purpose: string;
  assignedTo?: any;
};

const MyDeals = () => {
  const [listed, setListed] = useState<Property[]>([]);
  const [deals, setDeals] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeals = async () => {
      if (!auth.currentUser?.email) {
        setLoading(false);
        return;
      }

      try {
        // 🔍 get Mongo user
        const userRes = await fetch(
          `${API}/users/email/${auth.currentUser.email}`
        );
        
        if (!userRes.ok) {
          console.error("Failed to fetch user:", userRes.status);
          setLoading(false);
          return;
        }
        
        const user = await userRes.json();

        if (!user?._id) {
          console.error("User has no _id:", user);
          setLoading(false);
          return;
        }

        console.log("Loading deals for user:", user._id);

        // 📌 My listed properties (all statuses)
        const listedRes = await fetch(
          `${API}/properties/owner/${user._id}`
        );
        const listedData = await listedRes.json();

        // 📦 All properties to find assigned deals
        const allRes = await fetch(`${API}/properties/all`);
        const all = await allRes.json();

        const myDeals = all.filter(
          (p: any) =>
            p.assignedTo &&
            (p.assignedTo === user._id || p.assignedTo?._id === user._id) &&
            (p.status === "BOOKED" || p.status === "SOLD")
        );

        setListed(listedData);
        setDeals(myDeals);
      } catch (err) {
        console.error("MyDeals load error", err);
      } finally {
        setLoading(false);
      }
    };

    loadDeals();
  }, []);

  if (loading) return <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>Loading your deals...</div>;

  return (
    <div className="page">
      {/* Page Header */}
      <div style={{
        marginBottom: "48px",
        paddingBottom: "32px",
        borderBottom: "1px solid rgba(226, 232, 240, 0.1)"
      }}>
        <h1 style={{
          fontSize: "40px",
          marginBottom: "8px"
        }}>
          💼 My Deals
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "16px" }}>
          Manage your listings and active deals
        </p>
      </div>

      {/* ================= MY LISTINGS ================= */}

      <div style={{ marginBottom: "60px" }}>
        <h2 style={{ marginBottom: "8px" }}>My Listed Properties</h2>
        <p style={{ color: "#94a3b8", marginBottom: "28px", fontSize: "15px" }}>
          {listed.length} property {listed.length === 1 ? "listing" : "listings"}
        </p>

        {listed.length === 0 && (
          <div style={{
            padding: "60px 40px",
            textAlign: "center",
            background: "linear-gradient(135deg, #1e293b 0%, #2d3748 100%)",
            borderRadius: "16px",
            border: "1px solid rgba(226, 232, 240, 0.1)"
          }}>
            <p style={{ color: "#cbd5e1", marginBottom: "20px" }}>No listings yet</p>
            <Link to="/add" style={{
              display: "inline-block",
              padding: "12px 28px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600"
            }}>
              Create Your First Listing
            </Link>
          </div>
        )}

        <div className="deal-grid">
          {listed.map(p => (
            <Link to={`/property/${p._id}`} key={p._id} className="deal-card">
              {p.image && (
                <img
                  src={`http://localhost:5000/uploads/${p.image}`}
                  alt={p.title}
                />
              )}
              <div className="deal-info">
                <h3 style={{ fontSize: "16px", marginBottom: "6px" }}>{p.title}</h3>
                <p style={{ color: "#667eea", fontSize: "16px", fontWeight: "700" }}>₹{p.price}</p>
                <span className={`status ${p.status.toLowerCase()}`}>
                  {p.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ================= MY BOOKINGS ================= */}

      <div>
        <h2 style={{ marginBottom: "8px" }}>Booked / Bought By Me</h2>
        <p style={{ color: "#94a3b8", marginBottom: "28px", fontSize: "15px" }}>
          {deals.length} active {deals.length === 1 ? "deal" : "deals"}
        </p>

        {deals.length === 0 && (
          <div style={{
            padding: "60px 40px",
            textAlign: "center",
            background: "linear-gradient(135deg, #1e293b 0%, #2d3748 100%)",
            borderRadius: "16px",
            border: "1px solid rgba(226, 232, 240, 0.1)"
          }}>
            <p style={{ color: "#cbd5e1" }}>No active deals yet</p>
          </div>
        )}

        <div className="deal-grid">
          {deals.map(p => (
            <Link to={`/property/${p._id}`} key={p._id} className="deal-card">
              {p.image && (
                <img
                  src={`http://localhost:5000/uploads/${p.image}`}
                  alt={p.title}
                />
              )}
              <div className="deal-info">
                <h3 style={{ fontSize: "16px", marginBottom: "6px" }}>{p.title}</h3>
                <p style={{ color: "#667eea", fontSize: "16px", fontWeight: "700" }}>₹{p.price}</p>
                <span className={`status ${p.status.toLowerCase()}`}>
                  {p.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyDeals;
