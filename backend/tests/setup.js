/**
 * Test Setup — Manages in-memory MongoDB and provides helper utilities.
 *
 * Uses mongodb-memory-server to spin up a temporary, isolated database
 * for each test run. No real MongoDB needed. Auto-cleaned after tests.
 */
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Book from "../models/Book.js";
import BookCategory from "../models/BookCategory.js";

let mongoServer;

// JWT secrets for test environment
const JWT_SECRET = "test_jwt_secret_key";
const JWT_REFRESH_SECRET = "test_jwt_refresh_secret_key";

// Set env vars before any test runs
process.env.JWT_SECRET = JWT_SECRET;
process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
process.env.NODE_ENV = "test";

/* ─── Database Lifecycle ──────────────────────────────── */

/**
 * Connect to a new in-memory MongoDB instance.
 * Called once before all tests in a file.
 */
export async function connectDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

/**
 * Drop all data from all collections.
 * Called between individual tests for isolation.
 */
export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Disconnect and stop the in-memory MongoDB.
 * Called once after all tests in a file complete.
 */
export async function closeDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/* ─── Auth Helpers ────────────────────────────────────── */

/**
 * Create a user directly in the database and return the user + JWT token.
 * This bypasses registration validation for test convenience.
 */
export async function createTestUser(overrides = {}) {
  const salt = await bcrypt.genSalt(10);
  const defaults = {
    userFullName: "Test User",
    email: `test${Date.now()}@library.com`,
    password: await bcrypt.hash("password123", salt),
    role: "admin",
    accountStatus: "active",
    mobileNumber: "9876543210",
    gender: "male",
    age: 25,
  };

  const userData = { ...defaults, ...overrides };
  // If overrides provides a plain-text password, hash it
  if (overrides.password && overrides.password.length < 50) {
    userData.password = await bcrypt.hash(overrides.password, salt);
  }

  const user = await User.create(userData);

  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { user, token };
}

/**
 * Create a test book directly in the database.
 */
export async function createTestBook(overrides = {}) {
  const defaults = {
    bookName: `Test Book ${Date.now()}`,
    author: "Test Author",
    bookCountAvailable: 5,
    language: "English",
    description: "A test book for unit testing.",
  };

  return await Book.create({ ...defaults, ...overrides });
}

/**
 * Create a test category directly in the database.
 */
export async function createTestCategory(name) {
  return await BookCategory.create({
    categoryName: name || `Category ${Date.now()}`,
  });
}
