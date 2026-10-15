const express = require("express");
const RentAgreement = require("../models/RentAgreement");
const Property = require("../models/Property");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { processRentReminders } = require("../services/rentReminders");
const { requireAuth, requireSelfEmail, sameId } = require("../middleware/auth");

const router = express.Router();

const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"];
const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Same cycle day in the month after `from` (cycle day is capped at 28). */
const nextCycleDate = (from, cycleDay) => {
  const d = new Date(from);
  return new Date(d.getFullYear(), d.getMonth() + 1, Math.min(cycleDay, 28));
};

const monthLabel = (date) => new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });

const loadAgreement = (id) => RentAgreement.findById(id).populate("owner tenant property");

const isParty = (agreement, user) => sameId(agreement.owner, user) || sameId(agreement.tenant, user);

/* ================= CRON: RENT REMINDERS ================= */
// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"

const processRemindersHandler = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    res.json({ success: true, ...(await processRentReminders()) });
  } catch (err) {
    console.error("PROCESS REMINDERS ERROR:", err);
    res.status(500).json({ message: "Failed to process reminders" });
  }
};

router.get("/process-reminders", processRemindersHandler);
router.post("/process-reminders", processRemindersHandler);

router.use(requireAuth);

/* ================= CREATE AGREEMENT (for a booked listing without one) ================= */

router.post("/create", async (req, res) => {
  try {
    const { propertyId, tenantEmail, rentalStartDate } = req.body;
    const owner = req.user;

    const [tenant, property] = await Promise.all([
      User.findOne({ email: tenantEmail }),
      Property.findById(propertyId)
    ]);

    if (!tenant || !property) {
      return res.status(400).json({ message: "Invalid tenant or property" });
    }
    if (!sameId(property.owner, owner)) {
      return res.status(403).json({ message: "Only the owner can create an agreement" });
    }
    if (property.purpose !== "RENT") {
      return res.status(400).json({ message: "Agreements can only be created for rental listings" });
    }
    if (property.assignedTo && !sameId(property.assignedTo, tenant)) {
      return res.status(400).json({ message: "This property is booked by another tenant" });
    }
    if (await RentAgreement.exists({ property: property._id, status: "ACTIVE" })) {
      return res.status(400).json({ message: "This property already has an active agreement" });
    }

    const rentAmount = Number(req.body.rentAmount) > 0 ? Number(req.body.rentAmount) : property.price;
    const startDate = rentalStartDate ? new Date(rentalStartDate) : new Date();
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Invalid start date" });
    }
    const cycleDay = Math.min(Number(req.body.paymentCycleDay) || startDate.getDate(), 28);

    const agreement = await RentAgreement.create({
      property: property._id,
      owner: owner._id,
      tenant: tenant._id,
      rentAmount,
      securityDeposit: Math.max(Number(req.body.securityDeposit) || 0, 0),
      rentalStartDate: startDate,
      nextPaymentDate: nextCycleDate(startDate, cycleDay),
      paymentCycleDay: cycleDay,
      paymentStatus: "PENDING",
      status: "ACTIVE",
      terms: text(req.body.terms, 3000)
    });

    property.status = "BOOKED";
    property.assignedTo = tenant._id;
    await property.save();

    await Notification.create({
      from: owner._id,
      to: tenant._id,
      property: property._id,
      action: "RENT_AGREEMENT_CREATED",
      message: `Rent agreement created for ${property.title}. Monthly rent: ${inr(rentAmount)}`
    });

    res.status(201).json({ success: true, agreement });
  } catch (err) {
    console.error("CREATE RENT AGREEMENT ERROR:", err);
    res.status(500).json({ message: "Failed to create rent agreement" });
  }
});

/* ================= LISTS FOR THE SIGNED-IN USER ================= */

router.get("/owner/:email", requireSelfEmail(), async (req, res) => {
  try {
    const agreements = await RentAgreement.find({ owner: req.user._id, status: "ACTIVE" })
      .populate("property", "title city area type image images price")
      .populate("tenant", "name email")
      .sort({ createdAt: -1 });
    res.json(agreements);
  } catch (err) {
    console.error("GET OWNER AGREEMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load agreements" });
  }
});

router.get("/tenant/:email", requireSelfEmail(), async (req, res) => {
  try {
    const agreements = await RentAgreement.find({ tenant: req.user._id, status: "ACTIVE" })
      .populate("property", "title city area type image images price")
      .populate("owner", "name email")
      .sort({ createdAt: -1 });
    res.json(agreements);
  } catch (err) {
    console.error("GET TENANT AGREEMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load agreements" });
  }
});

router.get("/history/:email", requireSelfEmail(), async (req, res) => {
  try {
    const user = req.user;
    const history = await RentAgreement.find({
      $or: [{ owner: user._id }, { tenant: user._id }],
      status: { $in: ["TERMINATED", "COMPLETED"] }
    })
      .populate("property", "title type city area price images image")
      .populate("owner", "name email")
      .populate("tenant", "name email")
      .sort({ rentalEndDate: -1 });

    res.json(
      history.map((agreement) => {
        const obj = agreement.toObject();
        obj.userRole = sameId(agreement.owner, user) ? "OWNER" : "TENANT";
        if (agreement.rentalStartDate && agreement.rentalEndDate) {
          obj.durationMonths = Math.max(
            Math.round((agreement.rentalEndDate - agreement.rentalStartDate) / (1000 * 60 * 60 * 24 * 30)),
            0
          );
        }
        obj.totalPayments = agreement.paymentHistory?.length || 0;
        obj.totalAmountPaid = (agreement.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        return obj;
      })
    );
  } catch (err) {
    console.error("GET RENTAL HISTORY ERROR:", err);
    res.status(500).json({ message: "Failed to load rental history" });
  }
});

// Owner's booked rental listings that do not have an active agreement yet
router.get("/pending-properties/:email", requireSelfEmail(), async (req, res) => {
  try {
    const [bookedProperties, activeAgreements] = await Promise.all([
      Property.find({ owner: req.user._id, status: "BOOKED", purpose: "RENT" }).populate("assignedTo", "name email"),
      RentAgreement.find({ owner: req.user._id, status: "ACTIVE" }).select("property")
    ]);

    const withAgreement = new Set(activeAgreements.map((a) => String(a.property)));
    res.json(bookedProperties.filter((p) => !withAgreement.has(String(p._id))));
  } catch (err) {
    console.error("GET PENDING PROPERTIES ERROR:", err);
    res.status(500).json({ message: "Failed to load pending properties" });
  }
});

router.get("/property/:propertyId", async (req, res) => {
  try {
    const agreement = await RentAgreement.findOne({ property: req.params.propertyId, status: "ACTIVE" })
      .populate("property", "title city area type image price")
      .populate("owner", "name email")
      .populate("tenant", "name email");

    res.json(agreement && isParty(agreement, req.user) ? agreement : null);
  } catch (err) {
    console.error("GET AGREEMENT BY PROPERTY ERROR:", err);
    res.status(500).json({ message: "Failed to load agreement" });
  }
});

/* ================= SINGLE AGREEMENT ================= */

router.get("/:id", async (req, res) => {
  try {
    const agreement = await RentAgreement.findById(req.params.id)
      .populate("property", "title city area type image price amenities description")
      .populate("owner", "name email")
      .populate("tenant", "name email");

    if (!agreement || !isParty(agreement, req.user)) {
      return res.status(404).json({ message: "Agreement not found" });
    }
    res.json(agreement);
  } catch (err) {
    console.error("GET AGREEMENT ERROR:", err);
    res.status(500).json({ message: "Failed to load agreement" });
  }
});

/* ================= OWNER RECORDS A RECEIVED PAYMENT ================= */

router.post("/:id/pay", async (req, res) => {
  try {
    const agreement = await loadAgreement(req.params.id);
    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }
    if (!sameId(agreement.owner, req.user)) {
      return res.status(403).json({ message: "Only the owner can record a payment" });
    }
    if (agreement.status !== "ACTIVE") {
      return res.status(400).json({ message: "This agreement is no longer active" });
    }

    const amount = Number(req.body.amount) > 0 ? Number(req.body.amount) : agreement.rentAmount;
    const paymentMonth = monthLabel(agreement.nextPaymentDate);

    agreement.paymentHistory.push({
      amount,
      paidDate: new Date(),
      paymentMonth,
      status: "PAID",
      notes: text(req.body.notes, 500)
    });
    // Any pending tenant claim for this month is settled by this payment
    for (const request of agreement.paymentRequests || []) {
      if (request.status === "PENDING" && request.paymentMonth === paymentMonth) {
        request.status = "VERIFIED";
        request.verifiedAt = new Date();
      }
    }
    agreement.nextPaymentDate = nextCycleDate(agreement.nextPaymentDate, agreement.paymentCycleDay);
    agreement.paymentStatus = "PENDING";
    agreement.lastReminderSent = null;
    await agreement.save();

    await Notification.create({
      from: agreement.owner._id,
      to: agreement.tenant._id,
      property: agreement.property._id,
      action: "PAYMENT_CONFIRMED",
      message: `Payment of ${inr(amount)} confirmed for ${paymentMonth}`
    });

    res.json({ success: true, agreement });
  } catch (err) {
    console.error("MARK PAYMENT ERROR:", err);
    res.status(500).json({ message: "Failed to record payment" });
  }
});

/* ================= TENANT CLAIMS A PAYMENT ================= */

router.post("/:id/request-payment", async (req, res) => {
  try {
    const agreement = await loadAgreement(req.params.id);
    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }
    if (!sameId(agreement.tenant, req.user)) {
      return res.status(403).json({ message: "Only the tenant can submit a payment" });
    }
    if (agreement.status !== "ACTIVE") {
      return res.status(400).json({ message: "This agreement is no longer active" });
    }

    const paymentMonth = monthLabel(agreement.nextPaymentDate);
    if ((agreement.paymentRequests || []).some((r) => r.paymentMonth === paymentMonth && r.status === "PENDING")) {
      return res.status(400).json({ message: `A payment for ${paymentMonth} is already awaiting confirmation` });
    }

    const amount = Number(req.body.amount) > 0 ? Number(req.body.amount) : agreement.rentAmount;
    agreement.paymentRequests.push({
      amount,
      paymentMonth,
      paymentMethod: PAYMENT_METHODS.includes(req.body.paymentMethod) ? req.body.paymentMethod : "Other",
      transactionId: text(req.body.transactionId, 100),
      notes: text(req.body.notes, 500),
      requestedAt: new Date(),
      status: "PENDING"
    });
    await agreement.save();

    await Notification.create({
      from: agreement.tenant._id,
      to: agreement.owner._id,
      property: agreement.property._id,
      action: "PAYMENT_REQUEST",
      message: `${agreement.tenant.name || "Your tenant"} reported paying ${inr(amount)} for ${paymentMonth}. Please confirm.`
    });

    res.json({ success: true, message: "Payment sent to the owner for confirmation", agreement });
  } catch (err) {
    console.error("REQUEST PAYMENT ERROR:", err);
    res.status(500).json({ message: "Failed to submit payment" });
  }
});

/* ================= OWNER CONFIRMS / REJECTS A TENANT CLAIM ================= */

router.post("/:id/verify-payment", async (req, res) => {
  try {
    const { requestId, action } = req.body;
    const agreement = await loadAgreement(req.params.id);

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }
    if (!sameId(agreement.owner, req.user)) {
      return res.status(403).json({ message: "Only the owner can verify payments" });
    }

    const request = agreement.paymentRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: "Payment request not found" });
    }
    if (request.status !== "PENDING") {
      return res.status(400).json({ message: "This request has already been processed" });
    }

    if (action === "VERIFY") {
      request.status = "VERIFIED";
      request.verifiedAt = new Date();
      agreement.paymentHistory.push({
        amount: request.amount,
        paidDate: request.requestedAt || new Date(),
        paymentMonth: request.paymentMonth,
        status: "PAID",
        notes: `Method: ${request.paymentMethod}${request.transactionId ? ` · Ref: ${request.transactionId}` : ""}`
      });
      agreement.nextPaymentDate = nextCycleDate(agreement.nextPaymentDate, agreement.paymentCycleDay);
      agreement.paymentStatus = "PENDING";
      agreement.lastReminderSent = null;
    } else if (action === "REJECT") {
      request.status = "REJECTED";
      request.rejectionReason = text(req.body.rejectionReason, 300) || "Payment could not be verified";
    } else {
      return res.status(400).json({ message: "Invalid action. Use VERIFY or REJECT" });
    }

    await agreement.save();

    await Notification.create({
      from: agreement.owner._id,
      to: agreement.tenant._id,
      property: agreement.property._id,
      action: action === "VERIFY" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED",
      message:
        action === "VERIFY"
          ? `Your payment of ${inr(request.amount)} for ${request.paymentMonth} was confirmed by the owner.`
          : `Your payment for ${request.paymentMonth} was not confirmed. Reason: ${request.rejectionReason}`
    });

    res.json({ success: true, agreement });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

/* ================= TERMINATE (owner) ================= */

router.post("/:id/terminate", async (req, res) => {
  try {
    const agreement = await loadAgreement(req.params.id);
    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }
    if (!sameId(agreement.owner, req.user)) {
      return res.status(403).json({ message: "Only the owner can end this agreement" });
    }
    if (agreement.status !== "ACTIVE") {
      return res.status(400).json({ message: "This agreement has already ended" });
    }

    agreement.status = "TERMINATED";
    agreement.rentalEndDate = new Date();
    await agreement.save();

    await Property.updateOne({ _id: agreement.property._id }, { status: "AVAILABLE", assignedTo: null });

    const reason = text(req.body.reason, 300);
    await Notification.create({
      from: agreement.owner._id,
      to: agreement.tenant._id,
      property: agreement.property._id,
      action: "AGREEMENT_TERMINATED",
      message: `The rent agreement for ${agreement.property.title} has ended.${reason ? ` Reason: ${reason}` : ""}`
    });

    res.json({ success: true, agreement });
  } catch (err) {
    console.error("TERMINATE ERROR:", err);
    res.status(500).json({ message: "Failed to end agreement" });
  }
});

module.exports = router;
