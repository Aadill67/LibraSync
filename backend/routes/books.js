import express from "express";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Book from "../models/Book.js";
import BookCategory from "../models/BookCategory.js";
import BookTransaction from "../models/BookTransaction.js";
import ActivityLog from "../models/ActivityLog.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateAddBook } from "../middleware/validators.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Multer for CSV import
const csvUpload = multer({ storage: multer.memoryStorage() });

// Multer for book cover image upload
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/covers")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cover-${req.params.id}-${Date.now()}${ext}`);
  },
});
const coverUpload = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error("Only images (jpg, png, webp) allowed"), ext && mime);
  },
});

/* ─── Get All Books (with advanced search, filter, pagination, sort) ── */
router.get("/allbooks", async (req, res) => {
  try {
    const {
      title, author, category, search,
      available, language, sortBy = "createdAt",
      sortOrder = "desc", page = 1, limit = 10,
    } = req.query;
    const query = {};

    // Full-text search across multiple fields
    if (search) {
      query.$or = [
        { bookName: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
        { publisher: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (title) query.bookName = { $regex: title, $options: "i" };
    if (author) query.author = { $regex: author, $options: "i" };
    if (category) query.categories = category;
    if (language) query.language = { $regex: language, $options: "i" };
    if (available === "true") query.bookCountAvailable = { $gt: 0 };
    if (available === "false") query.bookCountAvailable = 0;

    // Sorting
    const sortField = ["bookName", "author", "createdAt", "avgRating", "bookCountAvailable"].includes(sortBy) ? sortBy : "createdAt";
    const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .populate("categories", "categoryName")
      .populate("transactions")
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .sort(sort);

    res.status(200).json({
      books,
      totalBooks: total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching books", error: err.message });
  }
});

/* ─── Get Book by ID ──────────────────────────────────── */
router.get("/getbook/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("categories", "categoryName")
      .populate("transactions");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: "Error fetching book", error: err.message });
  }
});

/* ─── Get Books by Category ───────────────────────────── */
router.get("/category", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const categoryData = await BookCategory.findOne({ categoryName: name }).populate("books");
    if (!categoryData) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(categoryData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching books by category", error: err.message });
  }
});

/* ─── QR Code Generation ─────────────────────────────── */
router.get("/qr/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const bookUrl = `${frontendUrl}/book/${book._id}`;
    const qrDataUrl = await QRCode.toDataURL(bookUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#1e293b", light: "#ffffff" },
    });

    res.json({ qrCode: qrDataUrl, url: bookUrl, bookName: book.bookName });
  } catch (err) {
    res.status(500).json({ message: "Error generating QR code", error: err.message });
  }
});

/* ─── Upload Book Cover Image ────────────────────────── */
router.post("/upload-cover/:id", verifyToken, authorizeRoles("admin", "librarian"), coverUpload.single("cover"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const coverUrl = `/uploads/covers/${req.file.filename}`;
    const book = await Book.findByIdAndUpdate(req.params.id, { coverImage: coverUrl }, { new: true });
    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Cover image uploaded", coverImage: coverUrl, book });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

/* ─── Book Recommendations (collaborative filtering) ─── */
router.get("/recommendations", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 6 } = req.query;

    // Get books the user has borrowed
    const userTxns = await BookTransaction.find({ borrowerId: userId }).select("bookId");
    const userBookIds = userTxns.map((t) => t.bookId?.toString()).filter(Boolean);

    if (userBookIds.length === 0) {
      // Cold start: return highest rated books
      const topBooks = await Book.find({ avgRating: { $gt: 0 } })
        .sort({ avgRating: -1 })
        .limit(parseInt(limit))
        .populate("categories", "categoryName");
      return res.json(topBooks);
    }

    // Find other users who borrowed the same books
    const similarUserTxns = await BookTransaction.find({
      bookId: { $in: userBookIds },
      borrowerId: { $ne: userId },
    }).select("borrowerId");
    const similarUserIds = [...new Set(similarUserTxns.map((t) => t.borrowerId?.toString()))];

    // Find books those similar users also borrowed (that current user hasn't)
    const recommendedTxns = await BookTransaction.find({
      borrowerId: { $in: similarUserIds },
      bookId: { $nin: userBookIds },
    }).select("bookId");

    // Count frequency of each recommended book
    const frequency = {};
    recommendedTxns.forEach((t) => {
      const id = t.bookId?.toString();
      if (id) frequency[id] = (frequency[id] || 0) + 1;
    });

    // Sort by frequency and get top N
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, parseInt(limit))
      .map(([id]) => id);

    let recommended = await Book.find({ _id: { $in: sorted } }).populate("categories", "categoryName");

    // If not enough, pad with top-rated books
    if (recommended.length < parseInt(limit)) {
      const padding = await Book.find({
        _id: { $nin: [...userBookIds, ...sorted] },
        avgRating: { $gt: 0 },
      })
        .sort({ avgRating: -1 })
        .limit(parseInt(limit) - recommended.length)
        .populate("categories", "categoryName");
      recommended = [...recommended, ...padding];
    }

    res.json(recommended);
  } catch (err) {
    res.status(500).json({ message: "Error generating recommendations", error: err.message });
  }
});

/* ─── Bulk CSV Import (Admin/Librarian) ───────────────── */
router.post(
  "/import",
  verifyToken,
  authorizeRoles("admin", "librarian"),
  csvUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "CSV file is required" });

      const csvText = req.file.buffer.toString("utf-8");
      const lines = csvText.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return res.status(400).json({ message: "CSV file is empty" });

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredFields = ["bookname", "author"];
      for (const f of requiredFields) {
        if (!headers.includes(f)) {
          return res.status(400).json({ message: `CSV must include column: ${f}` });
        }
      }

      const books = [];
      const errors = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row = {};
        headers.forEach((h, idx) => (row[h] = values[idx] || ""));

        try {
          books.push({
            bookName: row.bookname || row.bookName,
            author: row.author,
            isbn: row.isbn || undefined,
            publisher: row.publisher || "",
            language: row.language || "English",
            bookCountAvailable: parseInt(row.count || row.bookcountavailable || "1") || 1,
            description: row.description || "",
          });
        } catch (e) {
          errors.push({ line: i + 1, error: e.message });
        }
      }

      const inserted = await Book.insertMany(books, { ordered: false }).catch((e) => {
        if (e.insertedDocs) return e.insertedDocs;
        throw e;
      });

      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.name || "Staff",
        action: "import_books",
        details: `Imported ${inserted.length} books from CSV`,
        ipAddress: req.ip,
      });

      res.status(201).json({
        message: `${inserted.length} books imported successfully`,
        imported: inserted.length,
        errors,
      });
    } catch (err) {
      res.status(500).json({ message: "Import failed", error: err.message });
    }
  }
);

/* ─── Bulk CSV Export ─────────────────────────────────── */
router.get("/export", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const books = await Book.find({}).populate("categories", "categoryName");
    const headers = "BookName,Author,ISBN,Publisher,Language,Count,Status,Categories,AvgRating,Description";
    const rows = books.map((b) =>
      [
        `"${b.bookName}"`,
        `"${b.author}"`,
        b.isbn || "",
        `"${b.publisher || ""}"`,
        b.language || "",
        b.bookCountAvailable,
        b.bookStatus,
        `"${(b.categories || []).map((c) => c.categoryName).join(";")}"`,
        b.avgRating || 0,
        `"${(b.description || "").replace(/"/g, '""')}"`,
      ].join(",")
    );

    const csv = [headers, ...rows].join("\n");

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name || "Staff",
      action: "export_books",
      details: `Exported ${books.length} books to CSV`,
      ipAddress: req.ip,
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=librasync-books-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "Export failed", error: err.message });
  }
});

/* ─── Add a Book (Admin/Librarian only) ───────────────── */
router.post("/addbook", verifyToken, authorizeRoles("admin", "librarian"), validateAddBook, async (req, res) => {
  try {
    const newBook = new Book({
      bookName: req.body.bookName,
      alternateTitle: req.body.alternateTitle,
      author: req.body.author,
      isbn: req.body.isbn,
      bookCountAvailable: req.body.bookCountAvailable,
      language: req.body.language,
      publisher: req.body.publisher,
      bookStatus: req.body.bookStatus,
      categories: req.body.categories,
      coverImage: req.body.coverImage,
      description: req.body.description,
    });

    const book = await newBook.save();

    // Add book reference to categories
    if (book.categories && book.categories.length > 0) {
      await BookCategory.updateMany(
        { _id: { $in: book.categories } },
        { $push: { books: book._id } }
      );
    }

    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: "Error adding book", error: err.message });
  }
});

/* ─── Update a Book (Admin/Librarian only) ────────────── */
router.put("/updatebook/:id", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(updatedBook);
  } catch (err) {
    res.status(500).json({ message: "Error updating book", error: err.message });
  }
});

/* ─── Delete a Book (Admin only) ──────────────────────── */
router.delete("/removebook/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Remove book reference from categories
    if (book.categories && book.categories.length > 0) {
      await BookCategory.updateMany(
        { _id: { $in: book.categories } },
        { $pull: { books: book._id } }
      );
    }

    await Book.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting book", error: err.message });
  }
});

export default router;