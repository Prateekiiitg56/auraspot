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

  if (loading) return <div className="page">Loading your deals...</div>;

  return (
    <div className="page">
      <h2>My Deals</h2>

      {/* ================= MY LISTINGS ================= */}

      <h3>My Listed Properties</h3>
      {listed.length === 0 && <p>No listings yet</p>}

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
              <b>{p.title}</b>
              <p>₹{p.price}</p>
              <span className={`status ${p.status.toLowerCase()}`}>
                {p.status}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ================= MY BOOKINGS ================= */}

      <h3 style={{ marginTop: 40 }}>Booked / Bought By Me</h3>
      {deals.length === 0 && <p>No active deals yet</p>}

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
              <b>{p.title}</b>
              <p>₹{p.price}</p>
              <span className={`status ${p.status.toLowerCase()}`}>
                {p.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyDeals;
