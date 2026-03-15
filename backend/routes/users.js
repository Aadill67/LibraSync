import express from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for profile photos
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/profiles"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${Date.now()}${ext}`);
  },
});
const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error("Only images (jpg, png, webp) allowed"), ext && mime);
  },
});

const router = express.Router();

/* ─── Get User by ID ──────────────────────────────────── */
router.get("/getuser/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("activeTransactions")
      .populate("prevTransactions");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

/* ─── Get All Members (Admin/Librarian only) ──────────── */
router.get("/allmembers", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const users = await User.find({})
      .populate("activeTransactions")
      .populate("prevTransactions")
      .sort({ _id: -1 });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching members", error: err.message });
  }
});

/* ─── Update User by ID ──────────────────────────────── */
router.put("/updateuser/:id", verifyToken, async (req, res) => {
  try {
    // Users can update their own profile, admins can update anyone
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only update your own account" });
    }

    // If password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    // Don't allow non-admins to change their own role
    if (req.user.role !== "admin" && req.body.role) {
      delete req.body.role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
});

/* ─── Move Transaction to Active ─────────────────────── */
router.put("/:id/move-to-activetransactions", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.updateOne({ $push: { activeTransactions: req.params.id } });
    res.status(200).json({ message: "Added to active transactions" });
  } catch (err) {
    res.status(500).json({ message: "Error updating transactions", error: err.message });
  }
});

/* ─── Move Transaction to Previous ───────────────────── */
router.put("/:id/move-to-prevtransactions", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.updateOne({ $pull: { activeTransactions: req.params.id } });
    await user.updateOne({ $push: { prevTransactions: req.params.id } });
    res.status(200).json({ message: "Moved to previous transactions" });
  } catch (err) {
    res.status(500).json({ message: "Error moving transaction", error: err.message });
  }
});

/* ─── Delete User (Admin only) ───────────────────────── */
router.delete("/deleteuser/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
});

/* ─── Upload Profile Photo ────────────────────────────── */
router.post("/upload-photo", verifyToken, photoUpload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No photo uploaded" });

    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { photo: photoUrl });

    await ActivityLog.create({
      userId: req.user.id,
      userName: "User",
      action: "upload_photo",
      details: "Updated profile photo",
      ipAddress: req.ip,
    });

    res.json({ message: "Photo uploaded successfully", photo: photoUrl });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

/* ─── Change Password ─────────────────────────────────── */
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // Fetch user with password field
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save({ validateBeforeSave: false });

    await ActivityLog.create({
      userId: req.user.id,
      userName: user.userFullName,
      action: "change_password",
      details: "Password changed successfully",
      ipAddress: req.ip,
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error changing password", error: err.message });
  }
});

/* ─── Get Pending Users (Staff only) ─────────────────── */
router.get("/pending", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const pendingUsers = await User.find({ accountStatus: "pending" }).select("-password").sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending users", error: err.message });
  }
});

/* ─── Approve User Account (Staff only) ──────────────── */
router.put("/approve/:id", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.accountStatus === "active") {
      return res.status(400).json({ message: "User is already active" });
    }

    user.accountStatus = "active";
    await user.save({ validateBeforeSave: false });

    // Create welcome notification
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      userId: user._id,
      type: "info",
      title: "Account Approved!",
      message: "Your LibraSync account has been approved. Welcome to the library!",
      link: "/dashboard",
    });

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name || "Staff",
      action: "approve_user",
      details: `Approved account for ${user.userFullName} (${user.email})`,
      ipAddress: req.ip,
    });

    res.json({ message: "User account approved", user });
  } catch (err) {
    res.status(500).json({ message: "Error approving user", error: err.message });
  }
});

/* ─── Suspend / Reject User Account (Staff only) ─────── */
router.put("/suspend/:id", verifyToken, authorizeRoles("admin", "librarian"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.accountStatus = "suspended";
    await user.save({ validateBeforeSave: false });

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name || "Staff",
      action: "suspend_user",
      details: `Suspended account for ${user.userFullName} (${user.email})`,
      ipAddress: req.ip,
    });

    res.json({ message: "User account suspended", user });
  } catch (err) {
    res.status(500).json({ message: "Error suspending user", error: err.message });
  }
});

/* ─── Add to Wishlist ────────────────────────────────── */
router.post("/wishlist/:bookId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.wishlist.includes(req.params.bookId)) {
      return res.status(400).json({ message: "Book already in wishlist" });
    }
    user.wishlist.push(req.params.bookId);
    await user.save({ validateBeforeSave: false });
    res.json({ message: "Added to wishlist", wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: "Error adding to wishlist", error: err.message });
  }
});

/* ─── Remove from Wishlist ───────────────────────────── */
router.delete("/wishlist/:bookId", verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $pull: { wishlist: req.params.bookId } });
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    res.status(500).json({ message: "Error removing from wishlist", error: err.message });
  }
});

/* ─── Get Wishlist ───────────────────────────────────── */
router.get("/wishlist", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist");
    res.json(user.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: "Error fetching wishlist", error: err.message });
  }
});

export default router;