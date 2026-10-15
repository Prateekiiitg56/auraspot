const router = require("express").Router();
const Notification = require("../models/Notification");
const { requireAuth, requireSelfEmail, sameId } = require("../middleware/auth");

router.use(requireAuth);

/* ================= OWNER INBOX: open rent/buy requests ================= */

router.get("/owner/:ownerId", async (req, res) => {
  try {
    if (!sameId(req.params.ownerId, req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const notes = await Notification.find({ to: req.user._id, action: { $in: ["RENT", "BUY"] } })
      .populate("from", "name email")
      .populate("property", "title price status owner assignedTo")
      .sort({ createdAt: -1 });

    // Hide requests for deleted or already booked/sold listings
    res.json(notes.filter((n) => n.property && !["BOOKED", "SOLD"].includes(n.property.status)));
  } catch (err) {
    console.error("LOAD OWNER NOTES ERROR:", err);
    res.status(500).json({ message: "Failed loading notifications" });
  }
});

/* ================= HAS THE SIGNED-IN USER REQUESTED THIS PROPERTY ================= */

router.get("/check-request/:propertyId/:email", requireSelfEmail(), async (req, res) => {
  try {
    const existingRequest = await Notification.exists({
      from: req.user._id,
      property: req.params.propertyId,
      action: { $in: ["RENT", "BUY"] }
    });
    res.json({ hasRequested: !!existingRequest });
  } catch (err) {
    console.error("CHECK REQUEST ERROR:", err);
    res.status(500).json({ message: "Failed to check request" });
  }
});

/* ================= ALL NOTIFICATIONS FOR THE SIGNED-IN USER ================= */

router.get("/user/:email", requireSelfEmail(), async (req, res) => {
  try {
    const notes = await Notification.find({ to: req.user._id })
      .populate("from", "name email")
      .populate("property", "title price status images image city area")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(notes);
  } catch (err) {
    console.error("LOAD USER NOTES ERROR:", err);
    res.status(500).json({ message: "Failed loading notifications" });
  }
});

/* ================= UNREAD COUNT (navbar badge) ================= */

router.get("/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({ to: req.user._id, read: { $ne: true } });
    res.json({ count });
  } catch (err) {
    console.error("UNREAD COUNT ERROR:", err);
    res.status(500).json({ message: "Failed to load unread count" });
  }
});

router.put("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ to: req.user._id, read: { $ne: true } }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    console.error("MARK READ ERROR:", err);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

/* ================= DELETE ONE (recipient only) ================= */

router.delete("/:id", async (req, res) => {
  try {
    const result = await Notification.deleteOne({ _id: req.params.id, to: req.user._id });
    if (!result.deletedCount) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("DELETE NOTIFICATION ERROR:", err);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

/* ================= OWNER REJECTS A REQUEST ================= */

router.post("/reject/:notificationId", async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      to: req.user._id,
      action: { $in: ["RENT", "BUY"] }
    }).populate("property", "title");

    if (!notification) {
      return res.status(404).json({ message: "Request not found" });
    }

    await Notification.create({
      from: req.user._id,
      to: notification.from,
      property: notification.property?._id,
      action: "REJECTED",
      message: `Your request for ${notification.property?.title || "the property"} has been declined by the owner.`
    });
    await notification.deleteOne();

    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error("REJECT REQUEST ERROR:", err);
    res.status(500).json({ message: "Failed to reject request" });
  }
});

module.exports = router;
