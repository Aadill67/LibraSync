import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

// Route imports
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import userRoutes from "./routes/users.js";
import transactionRoutes from "./routes/transactions.js";
import categoryRoutes from "./routes/categories.js";
import notificationRoutes from "./routes/notifications.js";
import reviewRoutes from "./routes/reviews.js";
import activityLogRoutes from "./routes/activityLog.js";
import adminRoutes from "./routes/admin.js";

// Utilities
import { initCronJobs } from "./utils/cronJobs.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

/* ─── HTTP + Socket.IO Server ─────────────────────────── */
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

// Make io accessible in routes
app.set("io", io);

/* ─── Socket.IO Connection ────────────────────────────── */
io.on("connection", (socket) => {
  // Join user to their own room for targeted notifications
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`🔌 User ${userId} connected to notifications`);
    }
  });

  socket.on("disconnect", () => {
    // cleanup handled automatically
  });
});

/* ─── Middleware ────────────────────────────────────────── */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));

/* ─── Rate Limiting ────────────────────────────────────── */
import rateLimit from "express-rate-limit";

// Strict limiter for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

/* ─── Static File Serving (uploads) ────────────────────── */
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

/* ─── API Routes ───────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/activity-log", activityLogRoutes);
app.use("/api/admin", adminRoutes);

/* ─── Health Check ─────────────────────────────────────── */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Library Management System API is running",
    timestamp: new Date().toISOString(),
  });
});

/* ─── Production Static Serving ────────────────────────── */
if (false) {
  const frontendDist = path.join(__dirname, "../frontend-part/library-management-system/dist");
  app.use(express.static(frontendDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

/* ─── Global Error Handler ─────────────────────────────── */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

/* ─── Database Connection & Server Start ───────────────── */
// Skip auto-connect in test environment (tests manage their own DB)
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB");
      // Use httpServer instead of app.listen for Socket.IO
      httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 Library Management System API ready`);
        console.log(`🔌 Socket.IO ready for real-time notifications`);
      });
      // Initialize cron jobs
      initCronJobs();
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed:", err.message);
      process.exit(1);
    });
}

export default app;
