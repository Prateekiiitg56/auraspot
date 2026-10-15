import { useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "./Feedback";

/** Heart toggle that bookmarks a listing. Sends anonymous users to sign in. */
const SaveButton = ({ propertyId, className = "save-btn" }: { propertyId: string; className?: string }) => {
  const { user, savedIds, toggleSaved } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const saved = savedIds.has(propertyId);

  const onClick = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login", { state: { from: `/property/${propertyId}` } });
      return;
    }
    setBusy(true);
    try {
      const nowSaved = await toggleSaved(propertyId);
      toast.success(nowSaved ? "Saved to your homes" : "Removed from saved homes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update saved homes");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`${className} ${saved ? "saved" : ""}`}
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved homes" : "Save this home"}
      title={saved ? "Saved" : "Save"}
    >
      <Heart size={18} />
    </button>
  );
};

export default SaveButton;
