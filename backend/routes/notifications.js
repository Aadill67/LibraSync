import express from "express";
import Notification from "../models/Notification.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* ─── GET /api/notifications — user's notifications ──── */
router.get("/", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { userId: req.user.id };
    if (unreadOnly === "true") filter.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user.id, read: false }),
    ]);

    res.json({ notifications, total, unreadCount, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── PUT /api/notifications/read/:id — mark as read ─── */
router.put("/read/:id", verifyToken, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── PUT /api/notifications/read-all — mark all read ── */
router.put("/read-all", verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── DELETE /api/notifications/:id ───────────────────── */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
