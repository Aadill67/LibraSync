import express from "express";
import ActivityLog from "../models/ActivityLog.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

/* ─── GET /api/activity-log — paginated logs (admin) ─── */
router.get("/", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const { page = 1, limit = 25, action, userId, from, to } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── GET /api/activity-log/stats — action counts ─────── */
router.get("/stats", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await ActivityLog.countDocuments({
      createdAt: { $gte: todayStart },
    });

    res.json({ stats, todayCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── GET /api/activity-log/user/:userId — user's logs ── */
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    // Users can only see own logs; admin/librarian can see anyone's
    if (
      req.params.userId !== req.user.id &&
      !["admin", "librarian"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { page = 1, limit = 20 } = req.query;
    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments({ userId: req.params.userId }),
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
