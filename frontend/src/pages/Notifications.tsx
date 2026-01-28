import { useEffect, useState } from "react";
import { API } from "../services/api";
import { auth } from "../services/firebase";

const Notifications = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      if (!auth.currentUser?.email) {
        setLoading(false);
        return;
      }

      // 🔍 Get Mongo user
      const userRes = await fetch(
        `${API}/users/email/${auth.currentUser.email}`
      );
      const mongoUser = await userRes.json();

      if (!mongoUser?._id) {
        setLoading(false);
        return;
      }

      // 📩 Load owner inbox
      const res = await fetch(
        `${API}/notifications/owner/${mongoUser._id}`
      );

      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Notification load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  /* ================= ACCEPT REQUEST ================= */

  const acceptRequest = async (propertyId: string, notificationId: string) => {
    try {
      const res = await fetch(`${API}/properties/${propertyId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Approve failed");
      }

      alert("Deal accepted!");
      
      // Immediately remove from UI while fetching fresh data
      setNotes(notes.filter(n => n._id !== notificationId));
      
      // Fetch fresh data
      await loadNotifications();
    } catch (err) {
      console.error("Accept error:", err);
      alert("Failed to accept deal");
    }
  };

  if (loading) return <div className="page">Loading notifications...</div>;

  return (
    <div className="page">
      <h2>Notifications</h2>

      {notes.length === 0 && <p>No activity yet</p>}

      {notes.map(note => (
        <div key={note._id} className="notification-card">

          <div className="note-main">
            <b>{note.from?.name || note.from?.email}</b>{" "}
            wants to{" "}
            <b>{String(note.action).toLowerCase()}</b>{" "}
            your property
          </div>

          {note.property && (
            <div className="note-property">
              {note.property.title} — ₹{note.property.price}
            </div>
          )}

          {note.message && (
            <div className="note-message">
              “{note.message}”
            </div>
          )}

          <div className="note-footer">
            <small>
              {new Date(note.createdAt).toLocaleString()}
            </small>

            {/* ✅ PASS NOTIFICATION ID HERE */}
            <button
              className="accept-btn"
              onClick={() =>
                acceptRequest(
                  note.property._id,
                  note._id
                )
              }
            >
              Accept
            </button>
          </div>

        </div>
      ))}
    </div>
  );
};

export default Notifications;
