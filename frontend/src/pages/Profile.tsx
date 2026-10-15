import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { ShieldCheck, History, UserRound, LogOut, Pencil } from "lucide-react";
import { auth } from "../services/firebase";
import { apiFetch, apiJson, formatINR, getPropertyImage, readError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Feedback";
import ProfileSummary from "../components/ProfileSummary";
import type { PublicUser, UserStats } from "../components/ProfileSummary";

type Profile = PublicUser & {
  verificationDocuments?: Array<{ type: string; uploadedAt: string }>;
};

type RentalHistory = {
  _id: string;
  property: { _id: string; title: string; city?: string; area?: string; images?: string[]; image?: string };
  owner: { name: string; email: string };
  tenant: { name: string; email: string };
  rentAmount: number;
  rentalStartDate: string;
  rentalEndDate?: string;
  status: string;
  userRole: "OWNER" | "TENANT";
  durationMonths?: number;
  totalAmountPaid?: number;
};

const SOCIAL_KEYS = ["facebook", "twitter", "linkedin", "instagram", "youtube"] as const;
const DOC_TYPES = [
  { value: "AADHAR", label: "Aadhaar" },
  { value: "PAN", label: "PAN card" },
  { value: "DRIVING_LICENSE", label: "Driving licence" },
  { value: "PASSPORT", label: "Passport" }
];

const emptyForm = {
  name: "",
  location: "",
  bio: "",
  socials: { facebook: "", twitter: "", linkedin: "", instagram: "", youtube: "" } as Record<(typeof SOCIAL_KEYS)[number], string>
};

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—");

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile" | "history">("profile");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);

  const [docType, setDocType] = useState("AADHAR");
  const [docNumber, setDocNumber] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [history, setHistory] = useState<RentalHistory[] | null>(null);

  const applyProfile = (data: Profile) => {
    setProfile(data);
    setPhone(data.phone || "");
    setForm({
      name: data.name || "",
      location: data.location || "",
      bio: data.bio || "",
      socials: { ...emptyForm.socials, ...(data.socials || {}) }
    });
  };

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/users/me");
      if (!res.ok) throw new Error(await readError(res, "Could not load your profile"));
      const data: Profile = await res.json();
      applyProfile(data);
      const statsRes = await apiFetch(`/users/stats/${data._id}`);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load your profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab !== "history" || history || !user?.email) return;
    apiFetch(`/rent/history/${encodeURIComponent(user.email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [tab, history, user?.email]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await apiJson("/users/profile", "PUT", form);
      if (!res.ok) throw new Error(await readError(res, "Could not save your profile"));
      applyProfile(await res.json());
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  const sendOtp = async () => {
    setOtpBusy(true);
    try {
      const res = await apiJson("/users/send-otp", "POST", { phone });
      if (!res.ok) throw new Error(await readError(res, "Could not send the code"));
      const data = await res.json();
      setOtpSent(true);
      // The API only returns the code outside production, where no SMS provider is configured
      toast.success(data.otp ? `Verification code (test mode): ${data.otp}` : "Verification code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async () => {
    setOtpBusy(true);
    try {
      const res = await apiJson("/users/verify-phone-otp", "POST", { phone, otp });
      if (!res.ok) throw new Error(await readError(res, "Verification failed"));
      applyProfile((await res.json()).user);
      setOtp("");
      setOtpSent(false);
      toast.success("Phone number verified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setOtpBusy(false);
    }
  };

  const submitVerification = async (e: FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await apiJson("/users/verify", "POST", { documentType: docType, documentNumber: docNumber });
      if (!res.ok) throw new Error(await readError(res, "Verification failed"));
      applyProfile((await res.json()).user);
      setDocNumber("");
      toast.success("Identity verification submitted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="wrap page-section profile-layout">
        <div className="skeleton" style={{ height: 420 }} />
        <div className="skeleton" style={{ height: 420 }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="wrap page-section">
        <div className="paper-card empty-state">
          <h3>Couldn’t load your profile</h3>
          <button className="btn btn-outline" onClick={() => { setLoading(true); load(); }}>Try again</button>
        </div>
      </div>
    );
  }

  const phoneChanged = phone.trim() !== (profile.phone || "");

  return (
    <div className="wrap page-section profile-layout">
      <ProfileSummary user={profile} stats={stats} showPrivate>
        <div className="profile-summary-actions">
          <Link to={`/user/${encodeURIComponent(profile.email)}`} className="btn btn-outline btn-block">View public profile</Link>
          <button className="btn btn-ghost btn-block" onClick={logout}>
            <LogOut size={16} aria-hidden="true" /> Sign out
          </button>
        </div>
      </ProfileSummary>

      <div className="profile-main">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "profile"} className={`tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
            <UserRound size={16} aria-hidden="true" /> Profile & verification
          </button>
          <button role="tab" aria-selected={tab === "history"} className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            <History size={16} aria-hidden="true" /> Rental history
          </button>
        </div>

        {tab === "profile" ? (
          <div className="stack" role="tabpanel">
            <section className="paper-card">
              <div className="section-title-row">
                <h2>About</h2>
                {!editing && (
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={saveProfile}>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="p-name">Full name</label>
                      <input id="p-name" type="text" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="field">
                      <label htmlFor="p-location">City / location</label>
                      <input id="p-location" type="text" maxLength={120} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="p-bio">Bio</label>
                    <textarea id="p-bio" rows={4} maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell renters or owners a little about yourself" />
                    <p className="field-hint">{form.bio.length}/500</p>
                  </div>
                  <fieldset className="socials-fieldset">
                    <legend>Social profiles (username or URL)</legend>
                    <div className="form-row">
                      {SOCIAL_KEYS.map((key) => (
                        <div className="field" key={key}>
                          <label htmlFor={`s-${key}`} style={{ textTransform: "capitalize" }}>{key === "twitter" ? "X (Twitter)" : key}</label>
                          <input id={`s-${key}`} type="text" maxLength={200} value={form.socials[key]} onChange={(e) => setForm({ ...form, socials: { ...form.socials, [key]: e.target.value } })} />
                        </div>
                      ))}
                    </div>
                  </fieldset>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => { applyProfile(profile); setEditing(false); }}>Cancel</button>
                    <button type="submit" className="btn btn-solid" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                  </div>
                </form>
              ) : (
                <p className={profile.bio ? "profile-bio" : "muted"}>{profile.bio || "Add a short bio so others know who they are dealing with."}</p>
              )}
            </section>

            <section className="paper-card">
              <h2>Phone number</h2>
              <p className="muted section-sub">A verified phone number raises your trust badge and helps owners reach you.</p>
              <div className="inline-form">
                <div className="field">
                  <label htmlFor="p-phone">Mobile number</label>
                  <input id="p-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => { setPhone(e.target.value); setOtpSent(false); }} />
                </div>
                {profile.phoneVerified && !phoneChanged ? (
                  <span className="status-pill status-ok">Verified</span>
                ) : (
                  <button className="btn btn-outline" onClick={sendOtp} disabled={otpBusy || phone.trim().length < 10}>
                    {otpSent ? "Resend code" : "Send code"}
                  </button>
                )}
              </div>
              {otpSent && (
                <div className="inline-form">
                  <div className="field">
                    <label htmlFor="p-otp">6-digit code</label>
                    <input id="p-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                  </div>
                  <button className="btn btn-solid" onClick={verifyOtp} disabled={otpBusy || otp.length !== 6}>Verify</button>
                </div>
              )}
            </section>

            <section className="paper-card">
              <h2 className="inline-icon"><ShieldCheck size={20} aria-hidden="true" /> Identity verification</h2>
              {profile.verified ? (
                <p className="muted section-sub">
                  Your identity is verified
                  {profile.verificationDocuments?.length
                    ? ` with ${DOC_TYPES.find((d) => d.value === profile.verificationDocuments!.at(-1)!.type)?.label || "a document"}`
                    : ""}
                  . Listings show a “Verified owner” badge.
                </p>
              ) : (
                <form onSubmit={submitVerification}>
                  <p className="muted section-sub">Verified owners get a badge on every listing and rank higher in search.</p>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="v-type">Document type</label>
                      <select id="v-type" value={docType} onChange={(e) => setDocType(e.target.value)}>
                        {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="v-number">Document number</label>
                      <input id="v-number" type="text" autoComplete="off" maxLength={30} value={docNumber} onChange={(e) => setDocNumber(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-solid" disabled={verifying || docNumber.trim().length < 4}>
                    {verifying ? "Submitting…" : "Submit for verification"}
                  </button>
                </form>
              )}
            </section>
          </div>
        ) : (
          <div role="tabpanel">
            {history === null ? (
              <div className="skeleton" style={{ height: 160 }} />
            ) : history.length === 0 ? (
              <div className="paper-card empty-state">
                <History size={36} aria-hidden="true" />
                <h3>No past rentals</h3>
                <p>Ended rent agreements, as owner or tenant, will appear here.</p>
              </div>
            ) : (
              <div className="stack">
                {history.map((h) => (
                  <article key={h._id} className="paper-card history-card">
                    <img src={getPropertyImage(h.property)} alt="" />
                    <div className="history-body">
                      <div className="section-title-row">
                        <h3><Link to={`/property/${h.property?._id}`}>{h.property?.title || "Deleted listing"}</Link></h3>
                        <span className="status-pill status-neutral">{h.userRole === "OWNER" ? "You were the owner" : "You were the tenant"}</span>
                      </div>
                      <p className="muted">
                        {h.userRole === "OWNER" ? `Tenant: ${h.tenant?.name}` : `Owner: ${h.owner?.name}`} · {formatINR(h.rentAmount)}/month
                      </p>
                      <dl className="agreement-facts">
                        <div><dt>Period</dt><dd>{formatDate(h.rentalStartDate)} – {formatDate(h.rentalEndDate)}</dd></div>
                        <div><dt>Duration</dt><dd>{h.durationMonths ?? 0} months</dd></div>
                        <div><dt>Total paid</dt><dd className="mono">{formatINR(h.totalAmountPaid)}</dd></div>
                        <div><dt>Status</dt><dd>{h.status === "TERMINATED" ? "Ended" : "Completed"}</dd></div>
                      </dl>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
