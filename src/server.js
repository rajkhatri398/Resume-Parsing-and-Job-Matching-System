require("dotenv").config();

const app = require("./app");
const { initDB } = require("./models/db");

const PORT = parseInt(process.env.PORT) || 3000;

initDB();

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down...`);
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

module.exports = server;
