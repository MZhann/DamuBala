// api/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import { errorHandler } from "./middleware/index.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

// Allowed origins for CORS (supports comma-separated values in env)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://damu-bala.vercel.app",
  ...(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, "")) // strip trailing slashes
    .filter(Boolean),
];

// Deduplicate
const uniqueOrigins = [...new Set(allowedOrigins)];

console.log("🌐 Allowed CORS origins:", uniqueOrigins);

// Shared CORS config
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, health checks)
    if (!origin) return callback(null, true);
    if (uniqueOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`⛔ CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// CORS middleware — must be BEFORE all routes
app.use(cors(corsOptions));

// Preflight handler with the SAME config (Express 5 wildcard syntax)
app.options("/{*path}", cors(corsOptions));

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
  // Start HTTP server FIRST so Railway health checks pass
  app.listen(PORT, HOST, () => {
    console.log(`🚀 DamuBala API running on http://${HOST}:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 CORS origins: ${uniqueOrigins.join(", ")}`);
    console.log(`📚 Routes: /api/auth, /api/children, /api/games, /api/analytics, /api/emotions`);
  });

  // Then connect to MongoDB (with retry)
  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await connectDB();
      break;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt === MAX_RETRIES) {
        console.error("❌ All MongoDB connection attempts failed. Exiting.");
        process.exit(1);
      }
      // Wait before retrying (exponential backoff: 2s, 4s, 8s, 16s, 32s)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
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
