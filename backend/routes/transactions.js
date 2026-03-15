import express from "express";
import Book from "../models/Book.js";
import User from "../models/User.js";
import BookTransaction from "../models/BookTransaction.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import { sendIssueConfirmation, sendFineReceipt } from "../utils/emailService.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateAddTransaction, validateTransactionId } from "../middleware/validators.js";

const router = express.Router();

/* ─── Add Transaction (Issue a Book) ─────────────────── */
router.post("/add-transaction", verifyToken, authorizeRoles("admin", "librarian"), validateAddTransaction, async (req, res) => {
  try {
    const { bookId, borrowerId, bookName, borrowerName, transactionType, fromDate, toDate } = req.body;

    // Validate required fields
    if (!bookId || !borrowerId || !bookName || !borrowerName) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check book availability
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.bookCountAvailable <= 0) {
      return res.status(400).json({ message: "Book is not available for issuing" });
    }

    // Create transaction
    const newTransaction = new BookTransaction({
      bookId,
      borrowerId,
      bookName,
      borrowerName,
      transactionType: transactionType || "issued",
      fromDate: fromDate || new Date(),
      toDate,
    });

    const transaction = await newTransaction.save();

    // Update book: add transaction reference & decrease count
    await Book.findByIdAndUpdate(bookId, {
      $push: { transactions: transaction._id },
      $inc: { bookCountAvailable: -1 },
    });

    // Update user: add to active transactions
    await User.findByIdAndUpdate(borrowerId, {
      $push: { activeTransactions: transaction._id },
    });

    // Send email confirmation & create notification
    try {
      const borrower = await User.findById(borrowerId);
      if (borrower?.email) {
        sendIssueConfirmation(borrower.email, borrowerName, bookName, toDate);
      }
      await Notification.create({
        userId: borrowerId,
        type: "issue",
        title: "Book Issued",
        message: `"${bookName}" has been issued to you. Due: ${new Date(toDate).toLocaleDateString()}`,
        link: "/my-borrows",
      });
      // Emit real-time notification
      const io = req.app.get("io");
      if (io) io.to(borrowerId).emit("notification", { type: "issue", bookName });

      await ActivityLog.create({
        userId: req.user.id, userName: req.user.name || "Staff",
        action: "issue_book", details: `Issued "${bookName}" to ${borrowerName}`, ipAddress: req.ip,
      });
    } catch (emailErr) {
      console.warn("Email/notification failed:", emailErr.message);
    }

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: "Error creating transaction", error: err.message });
  }
});

/* ─── Return a Book ──────────────────────────────────── */
router.put("/return/:id", verifyToken, authorizeRoles("admin", "librarian"), validateTransactionId, async (req, res) => {
  try {
    const transaction = await BookTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.transactionStatus === "completed") {
      return res.status(400).json({ message: "Book has already been returned" });
    }

    // Calculate fine if overdue
    const fine = transaction.calculateFine();

    // Update transaction
    transaction.returnDate = new Date();
    transaction.transactionStatus = "completed";
    transaction.transactionType = "returned";
    transaction.fineAmount = fine;
    await transaction.save();

    // Update book: increase available count
    await Book.findByIdAndUpdate(transaction.bookId, {
      $inc: { bookCountAvailable: 1 },
    });

    // Update user: move from active to previous
    await User.findByIdAndUpdate(transaction.borrowerId, {
      $pull: { activeTransactions: transaction._id },
      $push: { prevTransactions: transaction._id },
    });

    // Send email & create notification
    try {
      const borrower = await User.findById(transaction.borrowerId);
      if (fine > 0 && borrower?.email) {
        sendFineReceipt(borrower.email, transaction.borrowerName, transaction.bookName, fine);
      }
      await Notification.create({
        userId: transaction.borrowerId,
        type: fine > 0 ? "fine" : "return",
        title: fine > 0 ? "Book Returned with Fine" : "Book Returned",
        message: fine > 0
          ? `"${transaction.bookName}" returned. Fine: ₹${fine}`
          : `"${transaction.bookName}" returned successfully.`,
        link: "/my-borrows",
      });
      const io = req.app.get("io");
      if (io) io.to(transaction.borrowerId.toString()).emit("notification", { type: "return", bookName: transaction.bookName });

      await ActivityLog.create({
        userId: req.user.id, userName: req.user.name || "Staff",
        action: "return_book", details: `Returned "${transaction.bookName}" by ${transaction.borrowerName}${fine > 0 ? ` — Fine: ₹${fine}` : ""}`, ipAddress: req.ip,
      });
    } catch (emailErr) {
      console.warn("Email/notification failed:", emailErr.message);
    }

    res.status(200).json({
      message: "Book returned successfully",
      transaction,
      fineAmount: fine,
    });
  } catch (err) {
    res.status(500).json({ message: "Error returning book", error: err.message });
  }
});

/* ─── Get All Transactions ───────────────────────────── */
router.get("/all-transactions", verifyToken, async (req, res) => {
  try {
    const transactions = await BookTransaction.find({})
      .populate("bookId", "bookName author")
      .populate("borrowerId", "userFullName email")
      .sort({ createdAt: -1 });

    // Dynamically calculate fines for active overdue transactions
    const enriched = transactions.map((t) => {
      const obj = t.toObject({ virtuals: true });
      // Calculate fine inline: if active and past due date
      if (t.transactionStatus !== "completed" && new Date() > t.toDate) {
        const diffTime = Math.abs(new Date() - new Date(t.toDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        obj.calculatedFine = diffDays * (t.finePerDay || 5);
      } else {
        obj.calculatedFine = t.fineAmount || 0;
      }
      return obj;
    });

    res.status(200).json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Error fetching transactions", error: err.message });
  }
});

/* ─── Get Overdue Transactions ───────────────────────── */
router.get("/overdue", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const overdueTransactions = await BookTransaction.find({
      transactionStatus: "active",
      toDate: { $lt: new Date() },
    })
      .populate("bookId", "bookName author")
      .populate("borrowerId", "userFullName email mobileNumber")
      .sort({ toDate: 1 });

    // Calculate fines for each
    const withFines = overdueTransactions.map((t) => ({
      ...t._doc,
      calculatedFine: t.calculateFine(),
    }));

    res.status(200).json(withFines);
  } catch (err) {
    res.status(500).json({ message: "Error fetching overdue transactions", error: err.message });
  }
});

/* ─── Dashboard Stats ────────────────────────────────── */
router.get("/stats", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalMembers = await User.countDocuments({ role: "member" });
    const activeTransactions = await BookTransaction.countDocuments({ transactionStatus: "active" });
    const overdueCount = await BookTransaction.countDocuments({
      transactionStatus: "active",
      toDate: { $lt: new Date() },
    });

    // Count pending reservations
    const pendingReservations = await BookTransaction.countDocuments({
      transactionType: "reserved",
      transactionStatus: "reserved",
    });

    // Monthly stats for charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTransactions = await BookTransaction.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Most popular books (top 5)
    const popularBooks = await BookTransaction.aggregate([
      { $group: { _id: "$bookName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      totalBooks,
      totalMembers,
      activeTransactions,
      overdueCount,
      pendingReservations,
      monthlyTransactions,
      popularBooks,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
});

/* ─── Update Transaction ─────────────────────────────── */
router.put("/update-transaction/:id", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const updatedTransaction = await BookTransaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json(updatedTransaction);
  } catch (err) {
    res.status(500).json({ message: "Error updating transaction", error: err.message });
  }
});

/* ─── Delete Transaction (Admin only) ────────────────── */
router.delete("/remove-transaction/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const transaction = await BookTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Remove transaction reference from book
    await Book.findByIdAndUpdate(transaction.bookId, {
      $pull: { transactions: transaction._id },
    });

    // Remove transaction reference from user's arrays
    await User.findByIdAndUpdate(transaction.borrowerId, {
      $pull: {
        activeTransactions: transaction._id,
        prevTransactions: transaction._id,
      },
    });

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting transaction", error: err.message });
  }
});

/* ─── Reserve a Book ─────────────────────────────────── */
router.post("/reserve", verifyToken, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Check if user already reserved this book
    const existing = await BookTransaction.findOne({
      bookId,
      borrowerId: userId,
      transactionType: "reserved",
      transactionStatus: "reserved",
    });
    if (existing) return res.status(400).json({ message: "You have already reserved this book" });

    // Check if user already has this book actively borrowed
    const activeBorrow = await BookTransaction.findOne({
      bookId,
      borrowerId: userId,
      transactionStatus: "active",
    });
    if (activeBorrow) return res.status(400).json({ message: "You already have this book borrowed" });

    const user = await User.findById(userId);

    const reservation = new BookTransaction({
      bookId,
      borrowerId: userId,
      bookName: book.bookName,
      borrowerName: user.userFullName,
      transactionType: "reserved",
      transactionStatus: "reserved",
      fromDate: new Date(),
      toDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day reservation hold
    });

    await reservation.save();
    res.status(201).json({ message: "Book reserved successfully!", reservation });
  } catch (err) {
    res.status(500).json({ message: "Error reserving book", error: err.message });
  }
});

/* ─── Cancel Reservation ─────────────────────────────── */
router.delete("/cancel-reservation/:id", verifyToken, async (req, res) => {
  try {
    const reservation = await BookTransaction.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    // Only owner or admin can cancel
    if (reservation.borrowerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await BookTransaction.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Reservation cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Error cancelling reservation", error: err.message });
  }
});

/* ─── Get My Reservations ────────────────────────────── */
router.get("/my-reservations", verifyToken, async (req, res) => {
  try {
    const reservations = await BookTransaction.find({
      borrowerId: req.user.id,
      transactionType: "reserved",
      transactionStatus: "reserved",
    })
      .populate("bookId", "bookName author bookCountAvailable")
      .sort({ createdAt: -1 });

    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reservations", error: err.message });
  }
});

/* ─── Reports & Analytics ────────────────────────────── */
router.get("/reports", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const BookCategory = (await import("../models/BookCategory.js")).default;

    // 1. Monthly transactions (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTransactions = await BookTransaction.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // 2. Category distribution (books per category)
    const categoryDistribution = await Book.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "bookcategories",
          localField: "_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: "$cat" },
      { $project: { name: "$cat.categoryName", count: 1 } },
      { $sort: { count: -1 } },
    ]);

    // 3. Top 10 most borrowed books
    const topBooks = await BookTransaction.aggregate([
      { $match: { transactionType: { $in: ["issued", "returned"] } } },
      { $group: { _id: "$bookName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // 4. Transaction status breakdown
    const statusBreakdown = await BookTransaction.aggregate([
      {
        $group: {
          _id: "$transactionStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Also count overdue specifically
    const overdueCount = await BookTransaction.countDocuments({
      transactionStatus: "active",
      toDate: { $lt: new Date() },
    });

    // 5. Fine collection summary (computed dynamically since fineAmount is not persisted)
    const allTransactions = await BookTransaction.find({});
    let totalFinesCollected = 0;
    let maxFine = 0;
    let fineCount = 0;
    const now = new Date();

    allTransactions.forEach((t) => {
      let fine = 0;
      if (t.transactionStatus === "completed" && t.fineAmount > 0) {
        fine = t.fineAmount;
      } else if (t.transactionStatus !== "completed" && now > t.toDate) {
        const diffDays = Math.ceil(Math.abs(now - new Date(t.toDate)) / (1000 * 60 * 60 * 24));
        fine = diffDays * (t.finePerDay || 5);
      }
      if (fine > 0) {
        totalFinesCollected += fine;
        if (fine > maxFine) maxFine = fine;
        fineCount++;
      }
    });

    const fineStats = {
      totalFinesCollected,
      avgFine: fineCount > 0 ? Math.round(totalFinesCollected / fineCount) : 0,
      maxFine,
      count: fineCount,
    };

    // 6. Member registration trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const memberGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: "member" } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // 7. Summary totals
    const totalBooks = await Book.countDocuments();
    const totalMembers = await User.countDocuments({ role: "member" });
    const totalTransactions = await BookTransaction.countDocuments();
    const activeTransactions = await BookTransaction.countDocuments({ transactionStatus: "active" });
    const completedTransactions = await BookTransaction.countDocuments({ transactionStatus: "completed" });
    const returnRate = totalTransactions > 0
      ? Math.round((completedTransactions / totalTransactions) * 100)
      : 0;

    // Determine busiest month
    let busiestMonth = null;
    if (monthlyTransactions.length > 0) {
      const busiest = monthlyTransactions.reduce((a, b) => (a.count > b.count ? a : b));
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      busiestMonth = `${monthNames[busiest._id.month]} ${busiest._id.year}`;
    }

    res.status(200).json({
      monthlyTransactions,
      categoryDistribution,
      topBooks,
      statusBreakdown,
      overdueCount,
      fineStats,
      memberGrowth,
      summary: {
        totalBooks,
        totalMembers,
        totalTransactions,
        activeTransactions,
        completedTransactions,
        returnRate,
        busiestMonth,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error generating reports", error: err.message });
  }
});

/* ─── Pay / Collect Fine ─────────────────────────────── */
router.put("/pay-fine/:id", verifyToken, authorizeRoles("admin", "librarian"), validateTransactionId, async (req, res) => {
  try {
    const transaction = await BookTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.fineAmount <= 0) {
      return res.status(400).json({ message: "No fine to collect for this transaction" });
    }
    if (transaction.finePaid) {
      return res.status(400).json({ message: "Fine has already been paid" });
    }

    transaction.finePaid = true;
    await transaction.save();

    // Create notification for the borrower
    try {
      await Notification.create({
        userId: transaction.borrowerId,
        type: "fine",
        title: "Fine Payment Confirmed",
        message: `Your fine of ₹${transaction.fineAmount} for "${transaction.bookName}" has been collected.`,
        link: "/my-borrows",
      });

      const io = req.app.get("io");
      if (io) io.to(transaction.borrowerId.toString()).emit("notification", { type: "fine_paid", bookName: transaction.bookName });

      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.name || "Staff",
        action: "collect_fine",
        details: `Collected fine ₹${transaction.fineAmount} for "${transaction.bookName}" from ${transaction.borrowerName}`,
        ipAddress: req.ip,
      });
    } catch (logErr) {
      console.warn("Notification/log failed:", logErr.message);
    }

    res.status(200).json({ message: "Fine collected successfully", transaction });
  } catch (err) {
    res.status(500).json({ message: "Error collecting fine", error: err.message });
  }
});

export default router;