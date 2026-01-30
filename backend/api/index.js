// Vercel Serverless Function Entry Point
const app = require("../server.js");

module.exports = (req, res) => {
  // Handle the request with Express
  app(req, res);
};
