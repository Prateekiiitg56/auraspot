const mongoose = require("mongoose");

let connecting = null;

/** Connects once and reuses the connection (safe for concurrent serverless requests). */
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGODB_URI, { maxPoolSize: 10 })
      .then(() => console.log("MongoDB connected"))
      .finally(() => {
        connecting = null;
      });
  }
  await connecting;
};

module.exports = connectDB;
