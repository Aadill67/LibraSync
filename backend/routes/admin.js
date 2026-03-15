import express from "express";
import mongoose from "mongoose";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

/* ─── GET /api/admin/backup — export all collections ──── */
router.get(
  "/backup",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const backup = {};

      for (const col of collections) {
        const data = await db.collection(col.name).find({}).toArray();
        backup[col.name] = data;
      }

      // Log the action
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.name || "Admin",
        action: "backup",
        details: `Full database backup — ${collections.length} collections exported`,
        ipAddress: req.ip,
      });

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=librasync-backup-${new Date().toISOString().slice(0, 10)}.json`
      );
      res.json(backup);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/* ─── POST /api/admin/restore — restore from JSON ─────── */
router.post(
  "/restore",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const backupData = req.body;
      if (!backupData || typeof backupData !== "object") {
        return res.status(400).json({ message: "Invalid backup data" });
      }

      const db = mongoose.connection.db;
      const results = {};

      for (const [collectionName, documents] of Object.entries(backupData)) {
        if (!Array.isArray(documents)) continue;

        // Drop existing collection and recreate
        try {
          await db.collection(collectionName).drop();
        } catch {
          // Collection may not exist
        }

        if (documents.length > 0) {
          await db.collection(collectionName).insertMany(documents);
          results[collectionName] = documents.length;
        }
      }

      // Log the action
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.name || "Admin",
        action: "restore",
        details: `Database restored — ${Object.keys(results).length} collections, ${Object.values(results).reduce((a, b) => a + b, 0)} documents`,
        ipAddress: req.ip,
      });

      res.json({
        message: "Database restored successfully",
        collections: results,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/* ─── GET /api/admin/stats — system stats ─────────────── */
router.get(
  "/stats",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const db = mongoose.connection.db;
      const adminDb = db.admin ? db.admin() : db;
      const collections = await db.listCollections().toArray();

      let totalDocuments = 0;
      const collectionStats = [];
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        totalDocuments += count;
        collectionStats.push({ name: col.name, count });
      }

      res.json({
        totalCollections: collections.length,
        totalDocuments,
        collectionStats,
        serverTime: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
