// api/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import { errorHandler } from "./middleware/index.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

// Parse allowed origins from env (comma-separated)
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "DamuBala API", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = parseInt(process.env.PORT || "4000", 10);
const HOST = "0.0.0.0";

async function start() {
  try {
    await connectDB();

    app.listen(PORT, HOST, () => {
      console.log(`🚀 DamuBala API running on http://${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 CORS origins: ${allowedOrigins.join(", ")}`);
      console.log(`📚 Routes: /api/auth, /api/children, /api/games, /api/analytics, /api/emotions`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  disconnectDB()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
