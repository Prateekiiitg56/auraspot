require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { processRentReminders } = require("./services/rentReminders");

const app = express();
const isServerless = !!process.env.VERCEL;

app.disable("x-powered-by");

const corsOptions = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "AuraSpot API is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Lazy DB connection (works for both long-running and serverless deployments)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(503).json({ message: "Service temporarily unavailable" });
  }
});

// Legacy local uploads (Vercel has a read-only filesystem; new uploads go to Cloudinary)
if (!isServerless) {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}

app.use("/properties", require("./routes/propertyRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));
app.use("/chat", require("./routes/chatRoutes"));
app.use("/rent", require("./routes/rentRoutes"));
app.use("/maintenance", require("./routes/maintenanceRoutes"));
app.use("/analytics", require("./routes/analyticsRoutes"));
app.use("/ai", require("./routes/aiRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Central error handler (malformed IDs, multer limits, unexpected errors)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier" });
  }
  if (err.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Each image must be 5MB or smaller" : err.message;
    return res.status(400).json({ message });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request is too large" });
  }
  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ message: "Something went wrong" });
});

// Long-running server: listen and run rent reminders hourly.
// On Vercel the /rent/process-reminders cron endpoint is used instead.
if (!isServerless) {
  const runReminders = async () => {
    try {
      await connectDB();
      const result = await processRentReminders();
      if (result.processed) console.log(`[CRON] Sent ${result.processed} rent reminder(s)`);
    } catch (err) {
      console.error("[CRON] Rent reminder error:", err.message);
    }
  };
  setInterval(runReminders, 60 * 60 * 1000);
  setTimeout(runReminders, 10000);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
