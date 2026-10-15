const express = require("express");
const Maintenance = require("../models/Maintenance");
const Property = require("../models/Property");
const Notification = require("../models/Notification");
const { requireAuth, requireSelfEmail, sameId } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const CATEGORIES = ["PLUMBING", "ELECTRICAL", "APPLIANCE", "HVAC", "STRUCTURAL", "PEST_CONTROL", "CLEANING", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["PENDING", "APPROVED", "IN_PROGRESS", "RESOLVED", "REJECTED"];
const STATUS_LABEL = {
  PENDING: "Pending",
  APPROVED: "Approved",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected"
};

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

const populated = (id) =>
  Maintenance.findById(id)
    .populate("property", "title city area image images")
    .populate("tenant", "name email phone")
    .populate("owner", "name email phone")
    .populate("updates.by", "name email");

/* ================= CREATE (tenant of the property) ================= */

router.post("/", async (req, res) => {
  try {
    const { propertyId, category } = req.body;
    const title = text(req.body.title, 100);
    const description = text(req.body.description, 1000);
    const priority = PRIORITIES.includes(req.body.priority) ? req.body.priority : "MEDIUM";

    if (!propertyId || !CATEGORIES.includes(category) || !title || !description) {
      return res.status(400).json({ message: "Category, title and description are required" });
    }

    const tenant = req.user;
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    if (!sameId(property.assignedTo, tenant)) {
      return res.status(403).json({ message: "You are not a tenant of this property" });
    }

    const maintenance = await Maintenance.create({
      property: property._id,
      tenant: tenant._id,
      owner: property.owner,
      category,
      title,
      description,
      priority,
      updates: [{ message: `Request created: ${title}`, by: tenant._id, role: "TENANT" }]
    });

    await Notification.create({
      from: tenant._id,
      to: property.owner,
      property: property._id,
      action: "MAINTENANCE_REQUEST",
      message: `New maintenance request: ${title} (${priority.toLowerCase()} priority)`
    });

    res.status(201).json(await populated(maintenance._id));
  } catch (err) {
    console.error("CREATE MAINTENANCE ERROR:", err);
    res.status(500).json({ message: "Failed to create maintenance request" });
  }
});

/* ================= LISTS ================= */

router.get("/tenant/:email", requireSelfEmail(), async (req, res) => {
  try {
    const requests = await Maintenance.find({ tenant: req.user._id })
      .populate("property", "title city area image images")
      .populate("owner", "name email phone")
      .populate("updates.by", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("GET TENANT MAINTENANCE ERROR:", err);
    res.status(500).json({ message: "Failed to load maintenance requests" });
  }
});

router.get("/owner/:email", requireSelfEmail(), async (req, res) => {
  try {
    const requests = await Maintenance.find({ owner: req.user._id })
      .populate("property", "title city area image images")
      .populate("tenant", "name email phone")
      .populate("updates.by", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("GET OWNER MAINTENANCE ERROR:", err);
    res.status(500).json({ message: "Failed to load maintenance requests" });
  }
});

// Visible to the property's owner and its current tenant only
router.get("/property/:propertyId", async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId).select("owner assignedTo");
    if (!property) return res.json([]);

    const isOwner = sameId(property.owner, req.user);
    const filter = { property: property._id };
    if (!isOwner) {
      if (!sameId(property.assignedTo, req.user)) return res.json([]);
      filter.tenant = req.user._id;
    }

    const requests = await Maintenance.find(filter)
      .populate("tenant", "name email")
      .populate("owner", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("GET PROPERTY MAINTENANCE ERROR:", err);
    res.status(500).json({ message: "Failed to load maintenance requests" });
  }
});

router.get("/stats/:email", requireSelfEmail(), async (req, res) => {
  try {
    const group = (field) =>
      Maintenance.aggregate([
        { $match: { [field]: req.user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
    const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
    const [asTenant, asOwner] = await Promise.all([group("tenant"), group("owner")]);

    res.json({ asTenant: toMap(asTenant), asOwner: toMap(asOwner) });
  } catch (err) {
    console.error("GET STATS ERROR:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

/* ================= SINGLE REQUEST ================= */

router.get("/:id", async (req, res) => {
  try {
    const request = await populated(req.params.id);
    if (!request || (!sameId(request.owner, req.user) && !sameId(request.tenant, req.user))) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }
    res.json(request);
  } catch (err) {
    console.error("GET MAINTENANCE ERROR:", err);
    res.status(500).json({ message: "Failed to load maintenance request" });
  }
});

/* ================= OWNER ACTIONS ================= */

const loadAsOwner = async (req, res) => {
  const maintenance = await Maintenance.findById(req.params.id);
  if (!maintenance) {
    res.status(404).json({ message: "Maintenance request not found" });
    return null;
  }
  if (!sameId(maintenance.owner, req.user)) {
    res.status(403).json({ message: "Not authorized" });
    return null;
  }
  return maintenance;
};

router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const maintenance = await loadAsOwner(req, res);
    if (!maintenance) return;

    const oldStatus = maintenance.status;
    maintenance.status = status;
    maintenance.resolvedDate = status === "RESOLVED" ? new Date() : null;
    maintenance.updates.push({
      message: text(req.body.message, 500) || `Status changed from ${STATUS_LABEL[oldStatus]} to ${STATUS_LABEL[status]}`,
      by: req.user._id,
      role: "OWNER"
    });
    await maintenance.save();

    await Notification.create({
      from: req.user._id,
      to: maintenance.tenant,
      property: maintenance.property,
      action: "MAINTENANCE_UPDATE",
      message: `Maintenance request "${maintenance.title}" is now ${STATUS_LABEL[status].toLowerCase()}`
    });

    res.json(await populated(maintenance._id));
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

router.put("/:id/assign-worker", async (req, res) => {
  try {
    const workerName = text(req.body.workerName, 80);
    const workerPhone = text(req.body.workerPhone, 20);
    const workerSpecialty = text(req.body.workerSpecialty, 80);
    if (!workerName || !workerPhone) {
      return res.status(400).json({ message: "Worker name and phone are required" });
    }

    const maintenance = await loadAsOwner(req, res);
    if (!maintenance) return;

    maintenance.assignedWorker = { name: workerName, phone: workerPhone, specialty: workerSpecialty };

    const scheduledDate = req.body.scheduledDate ? new Date(req.body.scheduledDate) : null;
    if (scheduledDate && !Number.isNaN(scheduledDate.getTime())) {
      maintenance.scheduledDate = scheduledDate;
    }
    const estimatedCost = Number(req.body.estimatedCost);
    if (estimatedCost > 0) {
      maintenance.estimatedCost = estimatedCost;
    }
    if (maintenance.status === "PENDING" || maintenance.status === "APPROVED") {
      maintenance.status = "IN_PROGRESS";
    }

    const specialty = workerSpecialty ? ` (${workerSpecialty})` : "";
    const schedule = maintenance.scheduledDate ? `, scheduled for ${maintenance.scheduledDate.toDateString()}` : "";
    maintenance.updates.push({
      message: `Worker assigned: ${workerName}${specialty}${schedule}`,
      by: req.user._id,
      role: "OWNER"
    });
    await maintenance.save();

    await Notification.create({
      from: req.user._id,
      to: maintenance.tenant,
      property: maintenance.property,
      action: "MAINTENANCE_UPDATE",
      message: `Worker assigned for "${maintenance.title}": ${workerName}${specialty}`
    });

    res.json(await populated(maintenance._id));
  } catch (err) {
    console.error("ASSIGN WORKER ERROR:", err);
    res.status(500).json({ message: "Failed to assign worker" });
  }
});

/* ================= COMMENT (owner or tenant) ================= */

router.post("/:id/comment", async (req, res) => {
  try {
    const message = text(req.body.message, 1000);
    if (!message) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    const isOwner = sameId(maintenance.owner, req.user);
    if (!isOwner && !sameId(maintenance.tenant, req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    maintenance.updates.push({ message, by: req.user._id, role: isOwner ? "OWNER" : "TENANT" });
    await maintenance.save();

    await Notification.create({
      from: req.user._id,
      to: isOwner ? maintenance.tenant : maintenance.owner,
      property: maintenance.property,
      action: "MAINTENANCE_COMMENT",
      message: `New comment on "${maintenance.title}": ${message.length > 60 ? `${message.slice(0, 60)}…` : message}`
    });

    res.json(await populated(maintenance._id));
  } catch (err) {
    console.error("ADD COMMENT ERROR:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

/* ================= TENANT RATES A RESOLVED REQUEST ================= */

router.put("/:id/rate", async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }
    if (!sameId(maintenance.tenant, req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (maintenance.status !== "RESOLVED") {
      return res.status(400).json({ message: "Only resolved requests can be rated" });
    }

    maintenance.rating = rating;
    maintenance.ratingFeedback = text(req.body.feedback, 500);
    await maintenance.save();

    res.json({ message: "Rating submitted", maintenance });
  } catch (err) {
    console.error("RATE MAINTENANCE ERROR:", err);
    res.status(500).json({ message: "Failed to submit rating" });
  }
});

module.exports = router;
