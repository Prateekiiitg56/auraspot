import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "../services/api";
import { auth } from "../services/firebase";

type Owner = {
  _id: string;
  name: string;
  email: string;
};

type Property = {
  _id: string;
  title: string;
  price: number;
  city: string;
  area: string;
  type: string;
  purpose: string;
  description: string;
  amenities: string[];
  latitude: number;
  longitude: number;
  image: string;
  status: string;
  owner?: Owner;
};

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const currentUser = auth.currentUser;

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const res = await fetch(`${API}/properties/${id}`);
        const data = await res.json();
        setProperty(data);
      } catch (err) {
        console.error("Failed loading property", err);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  if (loading) return <div className="page">Loading property...</div>;
  if (!property) return <div className="page">Property not found</div>;

  const isOwner =
    currentUser?.email &&
    property.owner?.email &&
    currentUser.email === property.owner.email;

const isUnavailable = property.status !== "AVAILABLE";


  /* ================= DELETE ================= */

  const deleteProperty = async () => {
    if (!window.confirm("Delete this property?")) return;

    await fetch(`${API}/properties/${property._id}`, {
      method: "DELETE"
    });

    navigate("/explore");
  };

  /* ================= SEND REQUEST ================= */

  const sendRequest = async () => {
    if (!currentUser) return alert("Please login first");

    if (!property.owner?._id) return alert("Owner info missing");

    if (!message.trim()) return alert("Please write a message");

    if (isUnavailable) return alert("Property already booked");

    await fetch(`${API}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: property.owner._id,
        propertyId: property._id,
        from: currentUser.email,
        action: property.purpose,
        message
      })
    });

    alert("Request sent to owner!");
    setMessage("");
  };

  /* ================= UI ================= */

  return (
    <div className="page details-page">

      {property.image && (
        <img
          src={`http://localhost:5000/uploads/${property.image}`}
          className="details-img"
          alt={property.title}
        />
      )}

      <h2>{property.title}</h2>

      <p className="price big">
        ₹{property.price.toLocaleString()}
      </p>

      <p>{property.city}, {property.area}</p>

      <div className="details-tags">
        {property.type} • {property.purpose}
      </div>

      {/* STATUS BADGE */}
      {isUnavailable && (
        <div style={{
          marginTop: 8,
          color: "#f87171",
          fontWeight: 600
        }}>
          {property.status}
        </div>
      )}

      <h3>Description</h3>
      <p>{property.description}</p>

      <h3>Amenities</h3>
      <ul>
        {property.amenities?.map((a, i) => (
          <li key={i}>✔ {a}</li>
        ))}
      </ul>

      <h3>Location</h3>
      <p>Latitude: {property.latitude}</p>
      <p>Longitude: {property.longitude}</p>

      <h3>Smart Property Score</h3>
      <p style={{ color: "#38bdf8", fontSize: 22, fontWeight: 600 }}>
        82 / 100
      </p>

      <h3>Listed By</h3>
      {property.owner ? (
        <div className="owner-box">
          <p><b>{property.owner.name}</b></p>
          <p>{property.owner.email}</p>
        </div>
      ) : (
        <p>Owner information unavailable</p>
      )}

      {/* MESSAGE */}
      {!isOwner && currentUser && !isUnavailable && (
        <textarea
          placeholder="Write a message to owner..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 10,
            borderRadius: 8
          }}
        />
      )}

      {/* ACTIONS */}

      {isOwner && (
        <button
          onClick={deleteProperty}
          style={{ background: "#ef4444", marginTop: 20 }}
        >
          Delete Property
        </button>
      )}

      {!isOwner && currentUser && !isUnavailable && (
        <button
          onClick={sendRequest}
          style={{ background: "#22c55e", marginTop: 20 }}
        >
          {property.purpose === "SALE" ? "Buy Property" : "Rent Property"}
        </button>
      )}

      {isUnavailable && (
        <p style={{ marginTop: 16, color: "#9ca3af" }}>
          This property is no longer available
        </p>
      )}

      {!currentUser && (
        <p style={{ marginTop: 20 }}>
          Login to contact owner
        </p>
      )}
    </div>
  );
};

export default PropertyDetails;
