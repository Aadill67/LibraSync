import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import { validateRegister, validateSignin } from "../middleware/validators.js";

const router = express.Router();

/* ─── Token Helper ────────────────────────────────────── */
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateTokens = (user, res) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    REFRESH_SECRET,
    { expiresIn: "30d" }
  );
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax", // 'none' required for cross-origin (Vercel↔Render)
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  return accessToken;
};

/* ─── User Registration ───────────────────────────────── */
router.post("/register", validateRegister, async (req, res) => {
  try {
    const { email, password, userFullName, mobileNumber } = req.body;

    // Validate required fields
    if (!email || !password || !userFullName || !mobileNumber) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      ...req.body,
      password: hashedPass,
    });

    const savedUser = await newUser.save();

    // Generate tokens
    const token = generateTokens(savedUser, res);

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = savedUser._doc;

    res.status(201).json({ ...userWithoutPassword, token });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

/* ─── User Login ──────────────────────────────────────── */
router.post("/signin", validateSignin, async (req, res) => {
  try {
    const { email, admissionId, employeeId, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Find user by email, admissionId, or employeeId
    let user;
    if (email) {
      user = await User.findOne({ email }).select("+password");
    } else if (admissionId) {
      user = await User.findOne({ admissionId }).select("+password");
    } else if (employeeId) {
      user = await User.findOne({ employeeId }).select("+password");
    } else {
      return res.status(400).json({ message: "Please provide email, admissionId, or employeeId" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate password
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check account status
    // Admin & Librarian accounts never need approval — auto-activate if somehow pending
    if (user.role === "admin" || user.role === "librarian") {
      if (user.accountStatus !== "active") {
        user.accountStatus = "active";
        await user.save({ validateBeforeSave: false });
      }
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({ message: "Your account has been suspended. Please contact the library administration." });
    }

    // Only members require approval
    if (user.role === "member" && user.accountStatus === "pending") {
      return res.status(403).json({ message: "Your account is pending approval by a librarian. Please wait for activation." });
    }

    // Generate tokens
    const token = generateTokens(user, res);

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user._doc;

    res.status(200).json({ ...userWithoutPassword, token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

/* ─── Forgot Password ────────────────────────────────── */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: "If an account exists, a reset link has been sent." });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || "https://libra-sync-v3xg.vercel.app";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Send email
    await sendPasswordResetEmail(user.email, user.userFullName, resetUrl);

    res.status(200).json({ message: "If an account exists, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: "Error processing request", error: err.message });
  }
});

/* ─── Reset Password ─────────────────────────────────── */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Hash the token from URL to match stored hash
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password and clear token
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Password reset successful! You can now sign in." });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password", error: err.message });
  }
});

/* ─── Refresh Access Token ───────────────────────────── */
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Issue a new access token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ token: accessToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

/* ─── Logout (clear refresh cookie) ──────────────────── */
router.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  res.json({ message: "Logged out" });
});

export default router;