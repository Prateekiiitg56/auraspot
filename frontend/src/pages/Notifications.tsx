import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Wallet,
  Wrench,
  FileText,
  AlertTriangle,
  Inbox,
  Trash2,
  Home
} from "lucide-react";
import { apiFetch, apiJson, formatINR, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast, confirmDialog } from "../components/Feedback";

type Person = { _id: string; name?: string; email: string };
type Note = {
  _id: string;
  action: string;
  message: string;
  createdAt: string;
  read?: boolean;
  from?: Person;
  property?: { _id: string; title: string; price?: number; status?: string } | null;
};

type Kind = { icon: LucideIcon; tone: string; link: (n: Note) => string };

const toProperty = (n: Note) => (n.property ? `/property/${n.property._id}` : "/notifications");
const KINDS: Record<string, Kind> = {
  ACCEPTED: { icon: CheckCircle2, tone: "ok", link: () => "/my-deals" },
  REJECTED: { icon: XCircle, tone: "danger", link: toProperty },
  MESSAGE: {
    icon: MessageSquare,
    tone: "info",
    link: (n) => (n.property && n.from ? `/chat/${n.property._id}?with=${encodeURIComponent(n.from.email)}` : "/messages")
  },
  RENT_AGREEMENT_CREATED: { icon: FileText, tone: "ok", link: () => "/rent-manager" },
  AGREEMENT_TERMINATED: { icon: FileText, tone: "neutral", link: () => "/profile" },
  PAYMENT_REQUEST: { icon: Wallet, tone: "warn", link: () => "/rent-manager" },
  PAYMENT_CONFIRMED: { icon: Wallet, tone: "ok", link: () => "/rent-manager" },
  PAYMENT_VERIFIED: { icon: Wallet, tone: "ok", link: () => "/rent-manager" },
  PAYMENT_REJECTED: { icon: Wallet, tone: "danger", link: () => "/rent-manager" },
  RENT_5_DAYS_BEFORE: { icon: Bell, tone: "info", link: () => "/rent-manager" },
  RENT_DUE_DATE: { icon: Bell, tone: "warn", link: () => "/rent-manager" },
  RENT_OVERDUE: { icon: AlertTriangle, tone: "danger", link: () => "/rent-manager" },
  MAINTENANCE_REQUEST: { icon: Wrench, tone: "warn", link: () => "/maintenance" },
  MAINTENANCE_UPDATE: { icon: Wrench, tone: "info", link: () => "/maintenance" },
  MAINTENANCE_COMMENT: { icon: Wrench, tone: "info", link: () => "/maintenance" }
};
const DEFAULT_KIND: Kind = { icon: Bell, tone: "neutral", link: toProperty };

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const Notifications = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<Note[]>([]);
  const [activity, setActivity] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.email || !profile?._id) return;
    try {
      const [ownerRes, userRes] = await Promise.all([
        apiFetch(`/notifications/owner/${profile._id}`),
        apiFetch(`/notifications/user/${encodeURIComponent(user.email)}`)
      ]);
      const owner: Note[] = ownerRes.ok ? await ownerRes.json() : [];
      const all: Note[] = userRes.ok ? await userRes.json() : [];
      setRequests(owner);
      // Requests are shown in their own section above
      setActivity(all.filter((n) => n.action !== "RENT" && n.action !== "BUY"));
      if (all.some((n) => !n.read)) apiJson("/notifications/read-all", "PUT").catch(() => undefined);
    } catch {
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, [user?.email, profile?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, request: () => Promise<Response>, success: string) => {
    setBusyId(id);
    try {
      const res = await request();
      if (!res.ok) throw new Error(await readError(res));
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  const accept = async (n: Note) => {
    if (!n.property || !n.from) return;
    const ok = await confirmDialog(`Accept ${n.from.name || n.from.email}'s request?`, {
      message: `${n.property.title} will be marked as ${n.action === "BUY" ? "sold" : "rented"}. Other requests for it will be declined automatically.`,
      confirmLabel: "Accept request"
    });
    if (ok) act(n._id, () => apiJson(`/properties/${n.property!._id}/approve`, "POST", { userId: n.from!._id }), "Request accepted");
  };

  const decline = async (n: Note) => {
    const ok = await confirmDialog("Decline this request?", {
      message: "The requester will be notified.",
      confirmLabel: "Decline",
      danger: true
    });
    if (ok) act(n._id, () => apiJson(`/notifications/reject/${n._id}`, "POST"), "Request declined");
  };

  const remove = (n: Note) => act(n._id, () => apiFetch(`/notifications/${n._id}`, { method: "DELETE" }), "Notification removed");

  if (loading) {
    return (
      <div className="wrap page-section">
        <div className="skeleton" style={{ height: 80, marginBottom: 20 }} />
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 68, marginBottom: 10 }} />)}
      </div>
    );
  }

  return (
    <div className="wrap page-section narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1>Notifications</h1>
          <p>Requests for your listings and updates on your rentals.</p>
        </div>
      </div>

      {requests.length > 0 && (
        <section className="notif-section" aria-labelledby="req-title">
          <h2 id="req-title" className="inline-icon"><Inbox size={18} aria-hidden="true" /> Requests to review ({requests.length})</h2>
          <ul className="notif-list">
            {requests.map((n) => (
              <li key={n._id} className="paper-card request-card">
                <div className="request-head">
                  <div>
                    <strong>{n.from?.name || n.from?.email}</strong>{" "}
                    <span className="muted">wants to {n.action === "BUY" ? "buy" : "rent"}</span>{" "}
                    {n.property && <Link to={`/property/${n.property._id}`} className="text-link">{n.property.title}</Link>}
                  </div>
                  <time className="muted mono">{relativeTime(n.createdAt)}</time>
                </div>
                {n.message && <p className="request-message">“{n.message}”</p>}
                <div className="request-actions">
                  {n.from && n.property && (
                    <Link to={`/chat/${n.property._id}?with=${encodeURIComponent(n.from.email)}`} className="btn btn-ghost btn-sm">
                      <MessageSquare size={15} aria-hidden="true" /> Message
                    </Link>
                  )}
                  {n.from && (
                    <Link to={`/user/${encodeURIComponent(n.from.email)}`} className="btn btn-ghost btn-sm">View profile</Link>
                  )}
                  <span className="spacer" />
                  <button className="btn btn-outline btn-sm" disabled={busyId === n._id} onClick={() => decline(n)}>Decline</button>
                  <button className="btn btn-solid btn-sm" disabled={busyId === n._id} onClick={() => accept(n)}>
                    Accept{n.property?.price ? ` · ${formatINR(n.property.price)}` : ""}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="notif-section" aria-labelledby="act-title">
        <h2 id="act-title" className="inline-icon"><Bell size={18} aria-hidden="true" /> Activity</h2>
        {activity.length === 0 ? (
          <div className="paper-card empty-state">
            <BellOff size={32} aria-hidden="true" />
            <h3>You’re all caught up</h3>
            <p>Updates about your requests, rent and maintenance will show up here.</p>
            <Link to="/explore" className="btn btn-outline"><Home size={16} aria-hidden="true" /> Explore homes</Link>
          </div>
        ) : (
          <ul className="notif-list paper-card activity-list">
            {activity.map((n) => {
              const kind = KINDS[n.action] || DEFAULT_KIND;
              const Icon = kind.icon;
              return (
                <li key={n._id} className={`activity-item ${n.read ? "" : "unread"}`}>
                  <span className={`activity-icon tone-${kind.tone}`} aria-hidden="true"><Icon size={16} /></span>
                  <Link to={kind.link(n)} className="activity-body">
                    <span>{n.message}</span>
                    <time className="muted">{relativeTime(n.createdAt)}</time>
                  </Link>
                  <button className="icon-btn" aria-label="Remove notification" disabled={busyId === n._id} onClick={() => remove(n)}>
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Notifications;
