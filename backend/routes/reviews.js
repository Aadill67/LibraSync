import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Book from "../models/Book.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* ─── POST /api/reviews — add/update a review ────────── */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;
    if (!bookId || !rating) {
      return res.status(400).json({ message: "bookId and rating are required" });
    }

    // Upsert: one review per user per book
    const review = await Review.findOneAndUpdate(
      { bookId, userId: req.user.id },
      { rating, comment: comment || "" },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Update book's average rating
    const stats = await Review.aggregate([
      { $match: { bookId: review.bookId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length) {
      await Book.findByIdAndUpdate(bookId, {
        avgRating: Math.round(stats[0].avgRating * 10) / 10,
        ratingsCount: stats[0].count,
      });
    }

    const populated = await Review.findById(review._id).populate(
      "userId",
      "userFullName photo"
    );
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You already reviewed this book" });
    }
    res.status(500).json({ message: err.message });
  }
});

/* ─── GET /api/reviews/book/:bookId — reviews for a book */
router.get("/book/:bookId", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const [reviews, total] = await Promise.all([
      Review.find({ bookId: req.params.bookId })
        .populate("userId", "userFullName photo")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Review.countDocuments({ bookId: req.params.bookId }),
    ]);

    // Get aggregated stats
    const stats = await Review.aggregate([
      { $match: { bookId: new mongoose.Types.ObjectId(req.params.bookId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      reviews,
      total,
      stats: stats[0] || { avgRating: 0, count: 0 },
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── DELETE /api/reviews/:id — delete own review ─────── */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id });
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Only owner or admin can delete
    if (review.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const bookId = review.bookId;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate average rating
    const stats = await Review.aggregate([
      { $match: { bookId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    await Book.findByIdAndUpdate(bookId, {
      avgRating: stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      ratingsCount: stats.length ? stats[0].count : 0,
    });

    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
