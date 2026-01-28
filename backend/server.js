const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const path = require("path");

connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/auth", require("./routes/authRoutes"));
app.use("/properties", require("./routes/propertyRoutes"));
app.use(express.urlencoded({ extended: true }));
app.use("/users", require("./routes/userRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));
app.use("/chat", require("./routes/chatRoutes"));

app.listen(5000, ()=>console.log("Server running on 5000"));




