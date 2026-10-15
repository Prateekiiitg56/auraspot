import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Wrench, Plus, HardHat, Star, Send } from "lucide-react";
import { apiFetch, apiJson, formatINR, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Feedback";
import { MaintenanceRequestForm } from "../components/maintenance";
import { STATUSES, categoryOf, priorityOf, statusOf } from "../components/maintenanceMeta";

type Person = { _id: string; name: string; email: string; phone?: string };
type Request = {
  _id: string;
  property: { _id: string; title: string; city?: string; area?: string };
  tenant: Person;
  owner: Person;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedWorker?: { name: string; phone: string; specialty: string };
  estimatedCost?: number;
  scheduledDate?: string;
  resolvedDate?: string;
  updates: Array<{ _id?: string; message: string; by?: { name: string; email: string }; role: string; createdAt: string }>;
  rating?: number;
  ratingFeedback?: string;
  createdAt: string;
};

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

const Maintenance = () => {
  const { user } = useAuth();
  const email = user?.email || "";
  const [role, setRole] = useState<"tenant" | "owner">("tenant");
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rentedProperties, setRentedProperties] = useState<{ _id: string; title: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [comment, setComment] = useState("");
  const [worker, setWorker] = useState({ workerName: "", workerPhone: "", workerSpecialty: "", scheduledDate: "", estimatedCost: "" });
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!email) return;
    try {
      const res = await apiFetch(`/maintenance/${role}/${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error(await readError(res));
      setRequests(await res.json());
    } catch (err) {
      setRequests([]);
      toast.error(err instanceof Error ? err.message : "Could not load requests");
    }
  }, [email, role]);

  useEffect(() => {
    load();
  }, [load]);

  // Properties the user currently rents (for raising new requests)
  useEffect(() => {
    if (!email) return;
    apiFetch(`/rent/tenant/${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list: { property: { _id: string; title: string } }[]) => setRentedProperties(list.map((a) => a.property).filter(Boolean)))
      .catch(() => setRentedProperties([]));
  }, [email]);

  const selected = useMemo(() => requests?.find((r) => r._id === selectedId) || null, [requests, selectedId]);
  const visible = useMemo(
    () => (requests || []).filter((r) => statusFilter === "ALL" || r.status === statusFilter),
    [requests, statusFilter]
  );
  const openCount = (requests || []).filter((r) => r.status !== "RESOLVED" && r.status !== "REJECTED").length;

  const mutate = async (call: () => Promise<Response>, success: string) => {
    setBusy(true);
    try {
      const res = await call();
      if (!res.ok) throw new Error(await readError(res));
      toast.success(success);
      await load();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openDetail = (r: Request) => {
    setSelectedId(r._id);
    setComment("");
    setShowWorkerForm(false);
    setRating(0);
    setWorker({
      workerName: r.assignedWorker?.name || "",
      workerPhone: r.assignedWorker?.phone || "",
      workerSpecialty: r.assignedWorker?.specialty || "",
      scheduledDate: r.scheduledDate ? r.scheduledDate.slice(0, 10) : "",
      estimatedCost: r.estimatedCost ? String(r.estimatedCost) : ""
    });
  };

  const sendComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !comment.trim()) return;
    if (await mutate(() => apiJson(`/maintenance/${selected._id}/comment`, "POST", { message: comment }), "Comment added")) setComment("");
  };

  const assignWorker = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (await mutate(() => apiJson(`/maintenance/${selected._id}/assign-worker`, "PUT", worker), "Worker assigned")) setShowWorkerForm(false);
  };

  const changeStatus = (status: string) =>
    selected && mutate(() => apiJson(`/maintenance/${selected._id}/status`, "PUT", { status }), `Marked as ${statusOf(status).label.toLowerCase()}`);

  const submitRating = () =>
    selected && rating > 0 && mutate(() => apiJson(`/maintenance/${selected._id}/rate`, "PUT", { rating }), "Thanks for your feedback");

  return (
    <div className="wrap page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Maintenance</p>
          <h1>Repairs & requests</h1>
          <p>Raise issues with your landlord or manage requests from your tenants.</p>
        </div>
        {role === "tenant" && rentedProperties.length > 0 && (
          <button className="btn btn-solid" onClick={() => setShowCreate(true)}>
            <Plus size={16} aria-hidden="true" /> New request
          </button>
        )}
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={role === "tenant"} className={`tab ${role === "tenant" ? "active" : ""}`} onClick={() => { setRole("tenant"); setRequests(null); }}>
          My requests
        </button>
        <button role="tab" aria-selected={role === "owner"} className={`tab ${role === "owner" ? "active" : ""}`} onClick={() => { setRole("owner"); setRequests(null); }}>
          From my tenants
        </button>
      </div>

      <div className="results-bar" style={{ marginBottom: 16 }}>
        <p className="results-count">{requests ? `${openCount} open · ${requests.length} total` : "Loading…"}</p>
        <div className="sort-control">
          <label htmlFor="m-filter">Status</label>
          <select id="m-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {requests === null ? (
        [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 84, marginBottom: 10 }} />)
      ) : visible.length === 0 ? (
        <div className="paper-card empty-state">
          <Wrench size={36} aria-hidden="true" />
          <h3>{requests.length ? "No requests with this status" : "No maintenance requests"}</h3>
          <p>
            {role === "tenant"
              ? rentedProperties.length
                ? "Something broken at home? Raise a request and your landlord is notified instantly."
                : "Requests can be raised for homes you currently rent through AuraSpot."
              : "Requests from your tenants will appear here."}
          </p>
          {role === "tenant" && rentedProperties.length > 0 && (
            <button className="btn btn-solid" onClick={() => setShowCreate(true)}>New request</button>
          )}
        </div>
      ) : (
        <ul className="request-list">
          {visible.map((r) => {
            const cat = categoryOf(r.category);
            const Icon = cat.icon;
            const status = statusOf(r.status);
            const priority = priorityOf(r.priority);
            return (
              <li key={r._id}>
                <button className="paper-card request-row" onClick={() => openDetail(r)}>
                  <span className="activity-icon tone-info" aria-hidden="true"><Icon size={16} /></span>
                  <span className="request-row-body">
                    <strong>{r.title}</strong>
                    <span className="muted">
                      {r.property?.title} · {cat.label} · {role === "owner" ? `From ${r.tenant?.name}` : `Opened ${fmt(r.createdAt)}`}
                    </span>
                  </span>
                  <span className={`status-pill ${priority.tone}`}>{priority.label}</span>
                  <span className={`status-pill ${status.tone}`}>{status.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="new-req-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="new-req-title" className="modal-title">New maintenance request</h3>
            <MaintenanceRequestForm
              properties={rentedProperties}
              onCancel={() => setShowCreate(false)}
              onCreated={() => {
                setShowCreate(false);
                if (role === "tenant") load();
                else setRole("tenant");
              }}
            />
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelectedId(null)}>
          <div className="modal-panel modal-lg" role="dialog" aria-modal="true" aria-labelledby="req-title" onClick={(e) => e.stopPropagation()}>
            <div className="section-title-row">
              <h3 id="req-title" className="modal-title" style={{ margin: 0 }}>{selected.title}</h3>
              <span className={`status-pill ${statusOf(selected.status).tone}`}>{statusOf(selected.status).label}</span>
            </div>
            <p className="modal-text">
              <Link to={`/property/${selected.property?._id}`} className="text-link">{selected.property?.title}</Link> · {categoryOf(selected.category).label} ·{" "}
              {priorityOf(selected.priority).label} priority · opened {fmt(selected.createdAt)}
            </p>
            <p className="request-description">{selected.description}</p>

            <dl className="agreement-facts">
              <div><dt>{role === "owner" ? "Tenant" : "Owner"}</dt><dd>{role === "owner" ? selected.tenant?.name : selected.owner?.name}</dd></div>
              <div><dt>Phone</dt><dd>{(role === "owner" ? selected.tenant?.phone : selected.owner?.phone) || "—"}</dd></div>
              <div><dt>Scheduled</dt><dd className="mono">{fmt(selected.scheduledDate)}</dd></div>
              <div><dt>Estimate</dt><dd className="mono">{selected.estimatedCost ? formatINR(selected.estimatedCost) : "—"}</dd></div>
            </dl>

            {selected.assignedWorker?.name && (
              <p className="worker-line inline-icon">
                <HardHat size={16} aria-hidden="true" /> {selected.assignedWorker.name}
                {selected.assignedWorker.specialty && ` · ${selected.assignedWorker.specialty}`} · {selected.assignedWorker.phone}
              </p>
            )}

            {role === "owner" && selected.status !== "RESOLVED" && selected.status !== "REJECTED" && (
              <div className="owner-controls">
                <div className="field">
                  <label htmlFor="m-status">Update status</label>
                  <select id="m-status" value={selected.status} disabled={busy} onChange={(e) => changeStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <button className="btn btn-outline" onClick={() => setShowWorkerForm((v) => !v)}>
                  <HardHat size={16} aria-hidden="true" /> {selected.assignedWorker?.name ? "Change worker" : "Assign worker"}
                </button>
              </div>
            )}

            {showWorkerForm && (
              <form className="worker-form" onSubmit={assignWorker}>
                <div className="form-row">
                  <div className="field"><label htmlFor="w-name">Worker name</label><input id="w-name" type="text" required value={worker.workerName} onChange={(e) => setWorker({ ...worker, workerName: e.target.value })} /></div>
                  <div className="field"><label htmlFor="w-phone">Phone</label><input id="w-phone" type="tel" required value={worker.workerPhone} onChange={(e) => setWorker({ ...worker, workerPhone: e.target.value })} /></div>
                  <div className="field"><label htmlFor="w-spec">Specialty</label><input id="w-spec" type="text" value={worker.workerSpecialty} onChange={(e) => setWorker({ ...worker, workerSpecialty: e.target.value })} /></div>
                  <div className="field"><label htmlFor="w-date">Visit date</label><input id="w-date" type="date" value={worker.scheduledDate} onChange={(e) => setWorker({ ...worker, scheduledDate: e.target.value })} /></div>
                  <div className="field"><label htmlFor="w-cost">Estimated cost (₹)</label><input id="w-cost" type="number" min={0} value={worker.estimatedCost} onChange={(e) => setWorker({ ...worker, estimatedCost: e.target.value })} /></div>
                </div>
                <button type="submit" className="btn btn-solid" disabled={busy}>Save worker</button>
              </form>
            )}

            {role === "tenant" && selected.status === "RESOLVED" && (
              <div className="rate-box">
                {selected.rating ? (
                  <span className="inline-icon muted"><Star size={15} aria-hidden="true" /> You rated this fix {selected.rating}/5</span>
                ) : (
                  <>
                    <span>How was the repair?</span>
                    <div className="star-input" role="radiogroup" aria-label="Rating" style={{ margin: 0 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} className={rating >= n ? "on" : ""} onClick={() => setRating(n)}>
                          <Star size={22} />
                        </button>
                      ))}
                    </div>
                    <button className="btn btn-solid btn-sm" disabled={!rating || busy} onClick={submitRating}>Submit</button>
                  </>
                )}
              </div>
            )}

            <h4 className="timeline-title">Updates</h4>
            <ol className="timeline">
              {[...selected.updates].reverse().map((u, i) => (
                <li key={u._id || i}>
                  <span className="timeline-meta">
                    <strong>{u.by?.name || (u.role === "OWNER" ? "Owner" : "Tenant")}</strong>
                    <time className="muted">{new Date(u.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time>
                  </span>
                  <p>{u.message}</p>
                </li>
              ))}
            </ol>

            <form className="comment-form" onSubmit={sendComment}>
              <label htmlFor="m-comment" className="visually-hidden">Add a comment</label>
              <input id="m-comment" type="text" maxLength={1000} placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button type="submit" className="btn btn-solid" disabled={busy || !comment.trim()} aria-label="Post comment"><Send size={16} aria-hidden="true" /></button>
            </form>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelectedId(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
