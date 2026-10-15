import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Home, KeyRound, MapPin, CalendarClock, CheckCircle2, Clock, AlertTriangle, Receipt, FilePlus2 } from "lucide-react";
import { apiFetch, apiJson, formatINR, getPropertyImage, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast, confirmDialog } from "../components/Feedback";

type Party = { _id: string; name: string; email: string };

type PaymentRequest = {
  _id: string;
  amount: number;
  paymentMonth: string;
  requestedAt: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  rejectionReason?: string;
};

type RentAgreement = {
  _id: string;
  property: { _id: string; title: string; city?: string; area?: string; type: string; image?: string; images?: string[] };
  owner: Party;
  tenant: Party;
  rentAmount: number;
  rentalStartDate: string;
  nextPaymentDate: string;
  paymentStatus: "PAID" | "PENDING" | "OVERDUE";
  paymentHistory: Array<{ _id?: string; amount: number; paidDate: string; paymentMonth: string; notes?: string }>;
  paymentRequests?: PaymentRequest[];
};

type PendingProperty = {
  _id: string;
  title: string;
  price: number;
  city?: string;
  area?: string;
  assignedTo?: Party;
};

const PAYMENT_METHODS = ["UPI", "Bank Transfer", "Cash", "Cheque", "Other"];
const DAY_MS = 1000 * 60 * 60 * 24;

const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const daysUntil = (d: string) => {
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / DAY_MS);
};

const DueBadge = ({ agreement }: { agreement: RentAgreement }) => {
  const days = daysUntil(agreement.nextPaymentDate);
  if (agreement.paymentStatus === "OVERDUE" || days < 0) {
    return (
      <span className="status-pill status-danger">
        <AlertTriangle size={13} aria-hidden="true" /> Overdue{days < 0 ? ` by ${-days}d` : ""}
      </span>
    );
  }
  if (days <= 5) {
    return (
      <span className="status-pill status-warn">
        <Clock size={13} aria-hidden="true" /> {days === 0 ? "Due today" : `Due in ${days}d`}
      </span>
    );
  }
  return (
    <span className="status-pill status-ok">
      <CheckCircle2 size={13} aria-hidden="true" /> Up to date
    </span>
  );
};

const RentManager = () => {
  const { user } = useAuth();
  const email = user?.email || "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [ownerAgreements, setOwnerAgreements] = useState<RentAgreement[]>([]);
  const [tenantAgreements, setTenantAgreements] = useState<RentAgreement[]>([]);
  const [pendingProperties, setPendingProperties] = useState<PendingProperty[]>([]);
  const [activeTab, setActiveTab] = useState<"owner" | "tenant">("owner");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Tenant "I paid" modal
  const [payTarget, setPayTarget] = useState<RentAgreement | null>(null);
  const [payForm, setPayForm] = useState({ method: "UPI", transactionId: "", notes: "" });

  // Owner "create agreement" modal
  const [createTarget, setCreateTarget] = useState<PendingProperty | null>(null);
  const [createForm, setCreateForm] = useState({ rentAmount: "", securityDeposit: "", startDate: "" });

  const [historyFor, setHistoryFor] = useState<RentAgreement | null>(null);

  const load = useCallback(async () => {
    if (!email) return;
    const e = encodeURIComponent(email);
    try {
      const [ownerRes, tenantRes, pendingRes] = await Promise.all([
        apiFetch(`/rent/owner/${e}`),
        apiFetch(`/rent/tenant/${e}`),
        apiFetch(`/rent/pending-properties/${e}`)
      ]);
      if (!ownerRes.ok || !tenantRes.ok) throw new Error(await readError(ownerRes.ok ? tenantRes : ownerRes));
      const owner: RentAgreement[] = await ownerRes.json();
      const tenant: RentAgreement[] = await tenantRes.json();
      setOwnerAgreements(owner);
      setTenantAgreements(tenant);
      setPendingProperties(pendingRes.ok ? await pendingRes.json() : []);
      setLoadError("");
      // Open the tab that has content
      setActiveTab((tab) => (tab === "owner" && owner.length === 0 && tenant.length > 0 ? "tenant" : tab));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load your agreements");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (id: string, action: () => Promise<Response>, success: string) => {
    setBusyId(id);
    try {
      const res = await action();
      if (!res.ok) throw new Error(await readError(res));
      toast.success(success);
      await load();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const recordPayment = async (a: RentAgreement) => {
    const ok = await confirmDialog(`Record ${formatINR(a.rentAmount)} received from ${a.tenant.name}?`, {
      message: "This marks the current month as paid and moves the due date to next month.",
      confirmLabel: "Record payment"
    });
    if (ok) run(a._id, () => apiJson(`/rent/${a._id}/pay`, "POST", { amount: a.rentAmount }), "Payment recorded");
  };

  const endLease = async (a: RentAgreement) => {
    const ok = await confirmDialog("End this rent agreement?", {
      message: `${a.property.title} will be listed as available again and ${a.tenant.name} will be notified.`,
      confirmLabel: "End agreement",
      danger: true
    });
    if (ok) run(a._id, () => apiJson(`/rent/${a._id}/terminate`, "POST", { reason: "Ended by owner" }), "Agreement ended");
  };

  const reviewClaim = async (a: RentAgreement, req: PaymentRequest, action: "VERIFY" | "REJECT") => {
    if (action === "REJECT") {
      const ok = await confirmDialog("Reject this payment?", {
        message: "The tenant will be told the payment could not be confirmed.",
        confirmLabel: "Reject",
        danger: true
      });
      if (!ok) return;
    }
    run(
      req._id,
      () => apiJson(`/rent/${a._id}/verify-payment`, "POST", { requestId: req._id, action }),
      action === "VERIFY" ? "Payment confirmed" : "Payment rejected"
    );
  };

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;
    const ok = await run(
      payTarget._id,
      () =>
        apiJson(`/rent/${payTarget._id}/request-payment`, "POST", {
          amount: payTarget.rentAmount,
          paymentMethod: payForm.method,
          transactionId: payForm.transactionId,
          notes: payForm.notes
        }),
      "Payment sent to the owner for confirmation"
    );
    if (ok) setPayTarget(null);
  };

  const submitAgreement = async (e: FormEvent) => {
    e.preventDefault();
    const tenant = createTarget?.assignedTo;
    if (!createTarget || !tenant) return;
    const ok = await run(
      createTarget._id,
      () =>
        apiJson("/rent/create", "POST", {
          propertyId: createTarget._id,
          tenantEmail: tenant.email,
          rentAmount: Number(createForm.rentAmount) || createTarget.price,
          securityDeposit: Number(createForm.securityDeposit) || 0,
          rentalStartDate: createForm.startDate || new Date().toISOString()
        }),
      "Rent agreement created"
    );
    if (ok) setCreateTarget(null);
  };

  const renderCard = (a: RentAgreement, isOwner: boolean) => {
    const other = isOwner ? a.tenant : a.owner;
    const pendingClaims = (a.paymentRequests || []).filter((r) => r.status === "PENDING");
    const location = [a.property.area, a.property.city].filter(Boolean).join(", ");
    const busy = busyId === a._id;

    return (
      <article key={a._id} className="paper-card agreement-card">
        <div className="agreement-main">
          <img src={getPropertyImage(a.property)} alt="" className="agreement-thumb" loading="lazy" />
          <div className="agreement-info">
            <h3>
              <Link to={`/property/${a.property._id}`}>{a.property.title}</Link>
            </h3>
            {location && (
              <p className="muted inline-icon"><MapPin size={13} aria-hidden="true" /> {location}</p>
            )}
            <p className="agreement-rent mono">
              {formatINR(a.rentAmount)} <span>/ month</span>
            </p>
          </div>
          <DueBadge agreement={a} />
        </div>

        <dl className="agreement-facts">
          <div>
            <dt>{isOwner ? "Tenant" : "Owner"}</dt>
            <dd><Link to={`/user/${encodeURIComponent(other.email)}`}>{other.name || other.email}</Link></dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd className="mono">{formatDate(a.rentalStartDate)}</dd>
          </div>
          <div>
            <dt>Next due</dt>
            <dd className="mono">{formatDate(a.nextPaymentDate)}</dd>
          </div>
          <div>
            <dt>Payments</dt>
            <dd className="mono">{a.paymentHistory.length}</dd>
          </div>
        </dl>

        {pendingClaims.length > 0 && (
          <div className="claim-list">
            {pendingClaims.map((r) => (
              <div key={r._id} className="claim-row">
                <div>
                  <strong>
                    {isOwner ? `${a.tenant.name} reported paying` : "Awaiting owner confirmation:"} {formatINR(r.amount)}
                  </strong>
                  <span className="muted">
                    {r.paymentMonth} · {r.paymentMethod}
                    {r.transactionId ? ` · Ref ${r.transactionId}` : ""}
                  </span>
                </div>
                {isOwner && (
                  <div className="claim-actions">
                    <button className="btn btn-outline btn-sm" disabled={busyId === r._id} onClick={() => reviewClaim(a, r, "REJECT")}>
                      Reject
                    </button>
                    <button className="btn btn-solid btn-sm" disabled={busyId === r._id} onClick={() => reviewClaim(a, r, "VERIFY")}>
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="agreement-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setHistoryFor(a)} disabled={a.paymentHistory.length === 0}>
            <Receipt size={15} aria-hidden="true" /> Payment history
          </button>
          <span className="spacer" />
          {isOwner ? (
            <>
              <button className="btn btn-outline btn-sm btn-text-danger" disabled={busy} onClick={() => endLease(a)}>
                End agreement
              </button>
              <button className="btn btn-solid btn-sm" disabled={busy} onClick={() => recordPayment(a)}>
                Record payment
              </button>
            </>
          ) : (
            pendingClaims.length === 0 && (
              <button
                className="btn btn-solid btn-sm"
                disabled={busy}
                onClick={() => {
                  setPayForm({ method: "UPI", transactionId: "", notes: "" });
                  setPayTarget(a);
                }}
              >
                I’ve paid this month
              </button>
            )
          )}
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="wrap page-section">
        <div className="skeleton" style={{ height: 90, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 220, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }

  const monthlyIncome = ownerAgreements.reduce((sum, a) => sum + a.rentAmount, 0);
  const awaitingReview = ownerAgreements.reduce(
    (n, a) => n + (a.paymentRequests || []).filter((r) => r.status === "PENDING").length,
    0
  );

  return (
    <div className="wrap page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Rent manager</p>
          <h1>Rent & agreements</h1>
          <p>Track monthly rent, confirm payments and manage active leases.</p>
        </div>
      </div>

      {loadError && (
        <div className="form-error" role="alert">
          {loadError}{" "}
          <button className="link-btn" onClick={() => { setLoading(true); load(); }}>Retry</button>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label="Agreement role">
        <button role="tab" aria-selected={activeTab === "owner"} className={`tab ${activeTab === "owner" ? "active" : ""}`} onClick={() => setActiveTab("owner")}>
          <Home size={16} aria-hidden="true" /> As owner <span className="tab-count">{ownerAgreements.length}</span>
        </button>
        <button role="tab" aria-selected={activeTab === "tenant"} className={`tab ${activeTab === "tenant" ? "active" : ""}`} onClick={() => setActiveTab("tenant")}>
          <KeyRound size={16} aria-hidden="true" /> As tenant <span className="tab-count">{tenantAgreements.length}</span>
        </button>
      </div>

      {activeTab === "owner" ? (
        <div role="tabpanel">
          {ownerAgreements.length > 0 && (
            <div className="summary-strip">
              <div><span>Active agreements</span><strong className="mono">{ownerAgreements.length}</strong></div>
              <div><span>Expected monthly rent</span><strong className="mono">{formatINR(monthlyIncome)}</strong></div>
              <div><span>Payments to confirm</span><strong className="mono">{awaitingReview}</strong></div>
            </div>
          )}

          {pendingProperties.length > 0 && (
            <section className="paper-card pending-box">
              <h2 className="inline-icon"><FilePlus2 size={18} aria-hidden="true" /> Booked without an agreement</h2>
              {pendingProperties.map((p) => (
                <div key={p._id} className="claim-row">
                  <div>
                    <strong>{p.title}</strong>
                    <span className="muted">Tenant: {p.assignedTo?.name || p.assignedTo?.email || "—"} · {formatINR(p.price)}/month</span>
                  </div>
                  <button
                    className="btn btn-solid btn-sm"
                    disabled={!p.assignedTo}
                    onClick={() => {
                      setCreateForm({ rentAmount: String(p.price), securityDeposit: "", startDate: new Date().toISOString().slice(0, 10) });
                      setCreateTarget(p);
                    }}
                  >
                    Create agreement
                  </button>
                </div>
              ))}
            </section>
          )}

          {ownerAgreements.length === 0 && pendingProperties.length === 0 ? (
            <div className="paper-card empty-state">
              <Home size={36} aria-hidden="true" />
              <h3>No active rentals yet</h3>
              <p>When you accept a rental request, the agreement and rent schedule appear here automatically.</p>
              <Link to="/add" className="btn btn-solid">List a property</Link>
            </div>
          ) : (
            ownerAgreements.map((a) => renderCard(a, true))
          )}
        </div>
      ) : (
        <div role="tabpanel">
          {tenantAgreements.length === 0 ? (
            <div className="paper-card empty-state">
              <KeyRound size={36} aria-hidden="true" />
              <h3>No active leases</h3>
              <p>Once an owner accepts your rental request, your rent schedule shows up here.</p>
              <Link to="/explore" className="btn btn-solid">Explore homes</Link>
            </div>
          ) : (
            tenantAgreements.map((a) => renderCard(a, false))
          )}
        </div>
      )}

      {payTarget && (
        <div className="modal-backdrop" onClick={() => setPayTarget(null)}>
          <form className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={(e) => e.stopPropagation()} onSubmit={submitPayment}>
            <h3 id="pay-title" className="modal-title">Report a rent payment</h3>
            <p className="modal-text">
              {formatINR(payTarget.rentAmount)} for {payTarget.property.title}. The owner confirms it once received.
            </p>
            <div className="field" style={{ marginTop: 20 }}>
              <label htmlFor="pay-method">Payment method</label>
              <select id="pay-method" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pay-ref">Transaction / reference ID <span className="muted">(optional)</span></label>
              <input id="pay-ref" type="text" maxLength={100} value={payForm.transactionId} onChange={(e) => setPayForm({ ...payForm, transactionId: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="pay-notes">Note <span className="muted">(optional)</span></label>
              <textarea id="pay-notes" rows={2} maxLength={500} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setPayTarget(null)}>Cancel</button>
              <button type="submit" className="btn btn-solid" disabled={busyId === payTarget._id}>
                {busyId === payTarget._id ? "Sending…" : "Send to owner"}
              </button>
            </div>
          </form>
        </div>
      )}

      {createTarget && (
        <div className="modal-backdrop" onClick={() => setCreateTarget(null)}>
          <form className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="create-title" onClick={(e) => e.stopPropagation()} onSubmit={submitAgreement}>
            <h3 id="create-title" className="modal-title">Create rent agreement</h3>
            <p className="modal-text">{createTarget.title} · Tenant {createTarget.assignedTo?.name}</p>
            <div className="form-row" style={{ marginTop: 20 }}>
              <div className="field">
                <label htmlFor="c-rent">Monthly rent (₹)</label>
                <input id="c-rent" type="number" min={1} required value={createForm.rentAmount} onChange={(e) => setCreateForm({ ...createForm, rentAmount: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="c-deposit">Security deposit (₹)</label>
                <input id="c-deposit" type="number" min={0} value={createForm.securityDeposit} onChange={(e) => setCreateForm({ ...createForm, securityDeposit: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="c-start">Start date</label>
              <input id="c-start" type="date" required value={createForm.startDate} onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })} />
              <p className="field-hint">Rent will be due on this day each month (capped at the 28th).</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setCreateTarget(null)}>Cancel</button>
              <button type="submit" className="btn btn-solid" disabled={busyId === createTarget._id}>Create agreement</button>
            </div>
          </form>
        </div>
      )}

      {historyFor && (
        <div className="modal-backdrop" onClick={() => setHistoryFor(null)}>
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="hist-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="hist-title" className="modal-title inline-icon"><CalendarClock size={18} aria-hidden="true" /> Payment history</h3>
            <p className="modal-text">{historyFor.property.title}</p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Month</th><th>Amount</th><th>Recorded</th><th>Note</th></tr>
                </thead>
                <tbody>
                  {[...historyFor.paymentHistory].reverse().map((p, i) => (
                    <tr key={p._id || i}>
                      <td>{p.paymentMonth}</td>
                      <td className="mono">{formatINR(p.amount)}</td>
                      <td className="mono">{formatDate(p.paidDate)}</td>
                      <td className="muted">{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setHistoryFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentManager;
