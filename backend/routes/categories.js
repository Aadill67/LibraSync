import express from "express";
import BookCategory from "../models/BookCategory.js";
import Book from "../models/Book.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

/* ─── Get All Categories ─────────────────────────────── */
router.get("/allcategories", async (req, res) => {
  try {
    const categories = await BookCategory.find({}).sort({ categoryName: 1 });
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories", error: err.message });
  }
});

/* ─── Add Category (Admin/Librarian only) ────────────── */
router.post("/addcategory", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const { categoryName } = req.body;
    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check for duplicates
    const existing = await BookCategory.findOne({ categoryName });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new BookCategory({ categoryName });
    const category = await newCategory.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Error adding category", error: err.message });
  }
});

/* ─── Delete Category (Admin only) ───────────────────── */
router.delete("/deletecategory/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const category = await BookCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    // Remove category reference from all books that had it
    await Book.updateMany(
      { categories: req.params.id },
      { $pull: { categories: req.params.id } }
    );
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting category", error: err.message });
  }
});

/* ─── Get Books by Category ──────────────────────────── */
router.get("/:id/books", async (req, res) => {
  try {
    const category = await BookCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const books = await Book.find({ categories: req.params.id })
      .populate("categories", "categoryName")
      .sort({ bookName: 1 });

    res.status(200).json({ category, books });
  } catch (err) {
    res.status(500).json({ message: "Error fetching books by category", error: err.message });
  }
});

export default router;
