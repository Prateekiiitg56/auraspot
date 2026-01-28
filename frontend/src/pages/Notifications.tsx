import { useEffect, useState } from "react";
import { API } from "../services/api";
import { auth } from "../services/firebase";

const Notifications = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser?.email) return;

      // try owner notifications first
      const userRes = await fetch(
        `${API}/users/email/${auth.currentUser.email}`
      );
      const mongoUser = await userRes.json();

      let res;

      if (mongoUser?._id) {
        res = await fetch(`${API}/notifications/owner/${mongoUser._id}`);
      } else {
        res = await fetch(`${API}/notifications/sender/${auth.currentUser.email}`);
      }

      const data = await res.json();
      setNotes(data);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div className="page">Loading notifications...</div>;

  if (notes.length === 0)
    return (
      <div className="page">
        <h2>Notifications</h2>
        <p>No notifications yet</p>
      </div>
    );

  return (
    <div className="page">
      <h2>Notifications</h2>

      {notes.map(n => (
        <div key={n._id} className="notification-card">

          {/* OWNER VIEW */}
          {n.ownerId && (
            <>
              <p>
                <b>{n.from}</b> wants to{" "}
                <b>{n.action.toLowerCase()}</b> your property
              </p>
            </>
          )}

          {/* SENDER VIEW */}
          {!n.ownerId && (
            <p>
              You sent a <b>{n.action.toLowerCase()}</b> request
            </p>
          )}

          {n.message && (
            <div className="note-message">
              "{n.message}"
            </div>
          )}

          <small>
            {new Date(n.createdAt).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
