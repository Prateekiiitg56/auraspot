const express = require("express");
const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const User = require("../models/User");
const Property = require("../models/Property");
const Notification = require("../models/Notification");
const { requireAuth, sameId } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const MAX_MESSAGE_LENGTH = 2000;

const populateChat = (query) =>
  query.populate("sender", "name email").populate("receiver", "name email").populate("property", "title city area price images image");

/* ================= SEND MESSAGE ================= */

router.post("/", async (req, res) => {
  try {
    const { propertyId, receiverEmail } = req.body;
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

    if (!propertyId || !receiverEmail || !message) {
      return res.status(400).json({ message: "Property, receiver and message are required" });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Messages are limited to ${MAX_MESSAGE_LENGTH} characters` });
    }

    const sender = req.user;
    const [receiver, property] = await Promise.all([
      User.findOne({ email: receiverEmail }),
      Property.findById(propertyId)
    ]);

    if (!receiver || !property) {
      return res.status(404).json({ message: "Receiver or property not found" });
    }
    if (sameId(receiver, sender)) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }
    // Every conversation is between the listing owner and one other user
    if (!sameId(property.owner, sender) && !sameId(property.owner, receiver)) {
      return res.status(403).json({ message: "Conversations must include the listing owner" });
    }

    const chat = await Chat.create({ property: property._id, sender: sender._id, receiver: receiver._id, message });

    // Keep a single "new message" notification per conversation
    await Notification.deleteMany({
      property: property._id,
      action: "MESSAGE",
      $or: [
        { from: sender._id, to: receiver._id },
        { from: receiver._id, to: sender._id }
      ]
    });
    await Notification.create({
      from: sender._id,
      to: receiver._id,
      property: property._id,
      action: "MESSAGE",
      message: `New message from ${sender.name || sender.email} about ${property.title}`
    });

    res.status(201).json(await populateChat(Chat.findById(chat._id)));
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

/* ================= INBOX: one entry per (property, other user) ================= */

router.get("/inbox", async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(String(req.user._id));

    const conversations = await Chat.aggregate([
      { $match: { $or: [{ sender: me }, { receiver: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUser: { $cond: [{ $eq: ["$sender", me] }, "$receiver", "$sender"] }
        }
      },
      {
        $group: {
          _id: { property: "$property", otherUser: "$otherUser" },
          lastMessage: { $first: "$message" },
          lastMessageTime: { $first: "$createdAt" },
          lastSender: { $first: "$sender" },
          unreadCount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$receiver", me] }, { $eq: ["$read", false] }] }, 1, 0] }
          }
        }
      },
      { $sort: { lastMessageTime: -1 } },
      { $limit: 100 }
    ]);

    await User.populate(conversations, { path: "_id.otherUser", select: "name email" });
    await Property.populate(conversations, { path: "_id.property", select: "title city area price images image owner" });

    res.json(
      conversations
        .filter((c) => c._id.otherUser && c._id.property)
        .map((c) => ({
          property: c._id.property,
          user: c._id.otherUser,
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime,
          lastMessageMine: sameId(c.lastSender, me),
          unreadCount: c.unreadCount
        }))
    );
  } catch (error) {
    console.error("INBOX ERROR:", error);
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

/* ================= MESSAGES BETWEEN ME AND ANOTHER USER FOR A PROPERTY ================= */

router.get("/property/:propertyId", async (req, res) => {
  try {
    const me = req.user;
    const other = req.query.otherUserEmail ? await User.findOne({ email: req.query.otherUserEmail }) : null;

    const query = other
      ? {
          property: req.params.propertyId,
          $or: [
            { sender: me._id, receiver: other._id },
            { sender: other._id, receiver: me._id }
          ]
        }
      : { property: req.params.propertyId, $or: [{ sender: me._id }, { receiver: me._id }] };

    res.json(await populateChat(Chat.find(query).sort({ createdAt: 1 }).limit(500)));
  } catch (error) {
    console.error("FETCH MESSAGES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

/* ================= MARK CONVERSATION AS READ ================= */

router.put("/read/:propertyId", async (req, res) => {
  try {
    const filter = { property: req.params.propertyId, receiver: req.user._id, read: false };
    if (req.body.otherUserEmail) {
      const other = await User.findOne({ email: req.body.otherUserEmail });
      if (other) filter.sender = other._id;
    }
    await Chat.updateMany(filter, { read: true });
    res.json({ ok: true });
  } catch (error) {
    console.error("MARK READ ERROR:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

/* ================= UNREAD MESSAGE COUNT ================= */

router.get("/unread-count", async (req, res) => {
  try {
    const unreadCount = await Chat.countDocuments({ receiver: req.user._id, read: false });
    res.json({ unreadCount });
  } catch (error) {
    console.error("UNREAD COUNT ERROR:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

module.exports = router;
