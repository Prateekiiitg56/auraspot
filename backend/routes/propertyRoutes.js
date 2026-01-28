const express = require("express");
const Property = require("../models/Property");
const User = require("../models/User");
const multer = require("multer");

const router = express.Router();


// ================= MULTER =================

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });


// ================= CREATE PROPERTY =================

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const owner = await User.findOne({ email: req.body.ownerEmail });

    if (!owner) {
      return res.status(400).json({ message: "Owner not found" });
    }

    let amenities = req.body.amenities;

    if (Array.isArray(amenities)) {
      amenities = amenities.flat().map(a => a.replace(/[\[\]"]/g, "").trim());
    } else {
      amenities = amenities
        .split(",")
        .map(a => a.trim())
        .filter(Boolean);
    }

    const property = await Property.create({
      title: req.body.title,
      type: req.body.type,
      purpose: req.body.purpose,
      price: Number(req.body.price),
      city: req.body.city,
      area: req.body.area,
      latitude: Number(req.body.latitude),
      longitude: Number(req.body.longitude),
      amenities,
      description: req.body.description,
      image: req.file?.filename,
      owner: owner._id
    });

    res.status(201).json(property);

  } catch (err) {
    console.error("CREATE PROPERTY ERROR:", err);
    res.status(500).json({ message: "Failed to add property" });
  }
});

// ================= GET ALL =================

router.get("/", async (req, res) => {
  const properties = await Property.find()
    .sort({ createdAt: -1 })
    .populate("owner", "name email")
    .populate("rentedBy", "name email");

  res.json(properties);
});


// ================= GET ONE =================

router.get("/:id", async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate("owner", "name email")
    .populate("rentedBy", "name email");

  res.json(property);
});


// ================= DELETE =================

router.delete("/:id", async (req, res) => {
  await Property.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});


// ================= REQUEST RENT =================
// (prepares for notifications system)

router.post("/:id/request", async (req, res) => {
  const { renterEmail } = req.body;

  const renter = await User.findOne({ email: renterEmail });
  if (!renter) return res.status(400).json({ message: "Renter not found" });

  const property = await Property.findById(req.params.id);

  if (property.status !== "AVAILABLE") {
    return res.status(400).json({ message: "Not available" });
  }

  property.status = "REQUESTED";
  property.rentedBy = renter._id;

  await property.save();

  res.json({ ok: true });
});


// ================= APPROVE RENT =================

router.post("/:id/approve", async (req, res) => {
  const property = await Property.findById(req.params.id);

  property.status = "RENTED";
  await property.save();

  res.json({ ok: true });
});

module.exports = router;
