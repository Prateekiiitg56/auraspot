import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { API, getImageUrl } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import VerificationStamp from "../components/VerificationStamp";

interface RentAgreement {
  _id: string;
  property: {
    _id: string;
    title: string;
    city?: string;
    area?: string;
    type: string;
    image?: string;
    price: number;
  };
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  tenant: {
    _id: string;
    name: string;
    email: string;
  };
  rentAmount: number;
  rentalStartDate: string;
  nextPaymentDate: string;
  paymentStatus: "PAID" | "PENDING" | "OVERDUE";
  status: "ACTIVE" | "COMPLETED" | "TERMINATED";
  paymentHistory: Array<{
    amount: number;
    paidDate: string;
    paymentMonth: string;
    status: string;
  }>;
  paymentRequests?: Array<{
    amount: number;
    paymentMonth: string;
    requestedAt: string;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    paymentMethod?: string;
    transactionId?: string;
    notes?: string;
    verifiedAt?: string;
    rejectionReason?: string;
  }>;
}

interface PendingProperty {
  _id: string;
  title: string;
  city?: string;
  area?: string;
  type: string;
  image?: string;
  price: number;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
}

const RentManager: React.FC = () => {
  const navigate = useNavigate();
  useTheme();
  const [loading, setLoading] = useState(true);
  const [ownerAgreements, setOwnerAgreements] = useState<RentAgreement[]>([]);
  const [tenantAgreements, setTenantAgreements] = useState<RentAgreement[]>([]);
  const [pendingProperties, setPendingProperties] = useState<PendingProperty[]>([]);
  const [activeTab, setActiveTab] = useState<"owner" | "tenant">("owner");
  const [selectedAgreement, setSelectedAgreement] = useState<RentAgreement | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PendingProperty | null>(null);
  const [rentAmount, setRentAmount] = useState("");
  const [addingAgreement, setAddingAgreement] = useState(false);

  const [showPaymentRequestModal, setShowPaymentRequestModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const currentUserEmail = auth.currentUser?.email || "";

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }
    loadAgreements();
  }, []);

  const loadAgreements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/rent/my-agreements?email=${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setOwnerAgreements(data.asOwner || []);
        setTenantAgreements(data.asTenant || []);
      }

      const pendingRes = await fetch(`${API}/rent/unassigned-properties?ownerEmail=${encodeURIComponent(currentUserEmail)}`);
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingProperties(pendingData || []);
      }
    } catch (error) {
      console.error("Failed to load agreements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const markAsPaid = async (agreement: RentAgreement) => {
    try {
      const res = await fetch(`${API}/rent/${agreement._id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: agreement.rentAmount,
          ownerEmail: currentUserEmail,
          notes: `Payment confirmed on ${new Date().toLocaleDateString()}`
        })
      });

      if (res.ok) {
        alert("Payment marked as received!");
        loadAgreements();
        setShowPaymentModal(false);
        setSelectedAgreement(null);
      }
    } catch (error) {
      console.error("Mark payment error:", error);
    }
  };

  const terminateAgreement = async (agreement: RentAgreement) => {
    if (!confirm("Are you sure you want to terminate this rent agreement?")) return;

    try {
      const res = await fetch(`${API}/rent/${agreement._id}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail: currentUserEmail, reason: "Terminated by owner" })
      });

      if (res.ok) {
        alert("Agreement terminated.");
        loadAgreements();
      }
    } catch (error) {
      console.error("Terminate error:", error);
    }
  };

  const requestPaymentVerification = async () => {
    if (!selectedAgreement) return;
    setSubmittingRequest(true);
    try {
      const nextPayment = new Date(selectedAgreement.nextPaymentDate);
      const paymentMonth = nextPayment.toLocaleString('default', { month: 'long', year: 'numeric' });

      const res = await fetch(`${API}/rent/${selectedAgreement._id}/request-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantEmail: currentUserEmail,
          amount: selectedAgreement.rentAmount,
          paymentMonth,
          paymentMethod,
          transactionId,
          notes: paymentNotes
        })
      });

      if (res.ok) {
        alert("Payment verification request sent!");
        setShowPaymentRequestModal(false);
        setSelectedAgreement(null);
        loadAgreements();
      }
    } catch (error) {
      console.error("Request error:", error);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const getPendingRequestsCount = (agreement: RentAgreement) => {
    return agreement.paymentRequests?.filter(r => r.status === "PENDING").length || 0;
  };

  const renderAgreementCard = (agreement: RentAgreement, isOwner: boolean) => {
    const daysUntilDue = getDaysUntilDue(agreement.nextPaymentDate);
    const isActive = agreement.status === "ACTIVE";

    return (
      <div
        key={agreement._id}
        className="paper-card deckle-edge"
        style={{ marginBottom: "20px" }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
          <img
            src={getImageUrl(agreement.property?.image)}
            alt={agreement.property?.title}
            style={{
              width: "130px",
              height: "90px",
              objectFit: "cover",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--paper-line)"
            }}
          />
          <div style={{ flex: 1, minWidth: "220px" }}>
            <h3 style={{ fontSize: "18px", margin: "0 0 4px", fontFamily: "var(--font-serif)" }}>
              {agreement.property?.title || "Property Unit"}
            </h3>
            <div style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: "8px" }}>
              📍 {agreement.property?.city}{agreement.property?.area ? `, ${agreement.property.area}` : ""}
            </div>
            <div className="mono" style={{ fontSize: "20px", fontWeight: 700, color: "var(--blueprint)" }}>
              ₹{agreement.rentAmount.toLocaleString()} / month
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            {isActive ? (
              <span className={`tag ${agreement.paymentStatus === "PAID" ? "tag-green" : "tag-amber"}`}>
                {agreement.paymentStatus === "PAID" ? "✓ Escrow Paid" : "⏳ Due Soon"}
              </span>
            ) : (
              <span className="tag" style={{ background: "var(--paper-line)", color: "var(--ink-soft)" }}>
                {agreement.status}
              </span>
            )}
            <VerificationStamp size="sm" rotation={-4} />
          </div>
        </div>

        {/* Ledger Details Row */}
        <div style={{
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "1px dashed var(--paper-line)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px",
          fontSize: "13px"
        }}>
          <div>
            <div style={{ color: "var(--ink-soft)", fontSize: "11px", textTransform: "uppercase" }}>
              {isOwner ? "Tenant Contact" : "Landlord Contact"}
            </div>
            <div style={{ fontWeight: 600, color: "var(--blueprint)", cursor: "pointer" }}
              onClick={() => navigate(`/user/${isOwner ? agreement.tenant.email : agreement.owner.email}`)}>
              {isOwner ? agreement.tenant?.name : agreement.owner?.name}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--ink-soft)", fontSize: "11px", textTransform: "uppercase" }}>Lease Commencement</div>
            <div className="mono">{new Date(agreement.rentalStartDate).toLocaleDateString()}</div>
          </div>

          <div>
            <div style={{ color: "var(--ink-soft)", fontSize: "11px", textTransform: "uppercase" }}>Next Settlement Due</div>
            <div className="mono" style={{ color: daysUntilDue <= 5 ? "var(--brick)" : "var(--ink)", fontWeight: 600 }}>
              {new Date(agreement.nextPaymentDate).toLocaleDateString()} ({daysUntilDue} days)
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {isOwner && isActive && (
            <>
              {agreement.paymentStatus !== "PAID" && (
                <button className="btn btn-blueprint" onClick={() => markAsPaid(agreement)}>
                  ✓ Confirm Receipt
                </button>
              )}
              <button className="btn btn-paper" style={{ color: "var(--brick)" }} onClick={() => terminateAgreement(agreement)}>
                End Lease
              </button>
            </>
          )}

          {!isOwner && agreement.paymentStatus !== "PAID" && (
            <button className="btn btn-blueprint" onClick={() => {
              setSelectedAgreement(agreement);
              setShowPaymentRequestModal(true);
            }}>
              💳 Record Escrow Payment
            </button>
          )}

          <button className="btn btn-paper" onClick={() => navigate(`/property/${agreement.property._id}`)}>
            Inspect Property →
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="wrap" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="ai-loading-spinner" style={{ margin: "0 auto 12px" }} />
        <div className="mono" style={{ color: "var(--ink-soft)" }}>Loading verified rent ledger...</div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ padding: "40px 24px" }}>
      {/* Title & Header */}
      <div style={{ marginBottom: "32px", borderBottom: "1px solid var(--paper-line)", paddingBottom: "20px" }}>
        <div className="mono" style={{ fontSize: "11px", color: "var(--blueprint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          AuraSpot Verified Escrow Ledger
        </div>
        <h1 style={{ fontSize: "32px", margin: "4px 0 8px" }}>
          Rent Manager & Lease Ledger
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "15px", margin: 0 }}>
          Manage active lease terms, monthly rent collections, and land title records.
        </p>
      </div>

      {/* Role Tabs */}
      <div className="system-tabs-container" style={{ marginBottom: "32px" }}>
        <button
          className={`system-tab-button ${activeTab === "owner" ? "active" : ""}`}
          onClick={() => setActiveTab("owner")}
        >
          🏠 Landlord Portfolio ({ownerAgreements.length})
        </button>
        <button
          className={`system-tab-button ${activeTab === "tenant" ? "active" : ""}`}
          onClick={() => setActiveTab("tenant")}
        >
          🔑 Tenant Leases ({tenantAgreements.length})
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === "owner" && (
        <div>
          <h2 style={{ fontSize: "22px", color: "var(--ink)", marginBottom: "20px" }}>
            Landlord Rent Collection Ledger
          </h2>

          {ownerAgreements.length === 0 && pendingProperties.length === 0 ? (
            /* Styled Ledger Empty State */
            <div className="paper-card" style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏠</div>
              <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>No Rented Properties Registered</h3>
              <p style={{ color: "var(--ink-soft)", maxWidth: "460px", margin: "0 auto 24px", fontSize: "14px" }}>
                You currently have no active tenant agreements or assigned properties under management. Post a property listing to begin tracking escrow rent collections.
              </p>
              <button className="btn btn-blueprint" onClick={() => navigate("/add-property")}>
                + Post Property Listing
              </button>
            </div>
          ) : (
            <div>
              {ownerAgreements.map(agreement => renderAgreementCard(agreement, true))}
            </div>
          )}
        </div>
      )}

      {activeTab === "tenant" && (
        <div>
          <h2 style={{ fontSize: "22px", color: "var(--ink)", marginBottom: "20px" }}>
            Tenant Active Leases
          </h2>

          {tenantAgreements.length === 0 ? (
            <div className="paper-card" style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔑</div>
              <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>No Active Leases Found</h3>
              <p style={{ color: "var(--ink-soft)", maxWidth: "460px", margin: "0 auto 24px", fontSize: "14px" }}>
                You have not signed any active property lease agreements via AuraSpot yet. Explore verified homes in your locality.
              </p>
              <button className="btn btn-blueprint" onClick={() => navigate("/explore")}>
                Explore Scored Homes →
              </button>
            </div>
          ) : (
            <div>
              {tenantAgreements.map(agreement => renderAgreementCard(agreement, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RentManager;
