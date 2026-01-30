// Vercel Serverless Function Entry Point
require("dotenv").config();
const app = require("../server.js");

// Export the Express app as a serverless function
module.exports = app;
