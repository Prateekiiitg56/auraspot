
const mongoose = require("mongoose");

const connectDB = async () => {
await mongoose.connect(
"mongodb+srv://ps332927:bay123ofbengal@cluster0.juiq6eg.mongodb.net/?appName=Cluster0"
)
 console.log("MongoDB connected");
};

module.exports = connectDB;


