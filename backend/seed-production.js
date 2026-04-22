/**
 * Safe Production Seeder for LibraSync
 * 
 * This script ONLY adds demo users and sample data if they don't already exist.
 * It will NOT delete any existing data. Safe to run on production.
 * 
 * Usage:
 *   NODE_ENV=development node seed-production.js
 *   
 * (NODE_ENV must not be 'production' due to the safety check in the original seed.js,
 *  but this script connects to whatever MONGO_URI is in your .env)
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/User.js";
import Book from "./models/Book.js";
import BookCategory from "./models/BookCategory.js";

dotenv.config();

const seedIfNeeded = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const salt = await bcrypt.genSalt(10);

    // ─── Seed Demo Users (only if they don't exist) ───
    const demoUsers = [
      {
        email: "admin@library.com",
        userFullName: "Admin User",
        password: await bcrypt.hash("admin123", salt),
        role: "admin",
        accountStatus: "active",
        employeeId: "EMP001",
        mobileNumber: "9876543210",
        gender: "male",
        age: 35,
      },
      {
        email: "librarian@library.com",
        userFullName: "Librarian User",
        password: await bcrypt.hash("librarian123", salt),
        role: "librarian",
        accountStatus: "active",
        employeeId: "EMP002",
        mobileNumber: "9876543211",
        gender: "female",
        age: 28,
      },
      {
        email: "student@library.com",
        userFullName: "Student User",
        password: await bcrypt.hash("member123", salt),
        role: "member",
        accountStatus: "active",
        admissionId: "STU001",
        mobileNumber: "9876543212",
        gender: "male",
        age: 20,
      },
    ];

    let usersCreated = 0;
    for (const userData of demoUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        console.log(`  ✅ Created: ${userData.email} (${userData.role})`);
        usersCreated++;
      } else {
        console.log(`  ⏭️  Exists: ${userData.email} (${userData.role})`);
      }
    }
    console.log(`👥 Users: ${usersCreated} created, ${demoUsers.length - usersCreated} already existed`);

    // ─── Seed Categories (only if none exist) ───
    const categoryCount = await BookCategory.countDocuments();
    if (categoryCount === 0) {
      const categories = await BookCategory.insertMany([
        { categoryName: "Fiction" },
        { categoryName: "Non-Fiction" },
        { categoryName: "Science" },
        { categoryName: "Technology" },
        { categoryName: "Mathematics" },
        { categoryName: "History" },
        { categoryName: "Literature" },
        { categoryName: "Self-Help" },
      ]);
      console.log("📂 Created 8 book categories");

      // ─── Seed Books (only if none exist) ───
      const bookCount = await Book.countDocuments();
      if (bookCount === 0) {
        const books = await Book.insertMany([
          {
            bookName: "Introduction to Algorithms",
            author: "Thomas H. Cormen",
            isbn: "978-0262033848",
            publisher: "MIT Press",
            language: "English",
            bookCountAvailable: 5,
            categories: [categories[3]._id, categories[4]._id],
            description: "A comprehensive textbook on algorithms.",
          },
          {
            bookName: "Clean Code",
            author: "Robert C. Martin",
            isbn: "978-0132350884",
            publisher: "Prentice Hall",
            language: "English",
            bookCountAvailable: 3,
            categories: [categories[3]._id],
            description: "A handbook of agile software craftsmanship.",
          },
          {
            bookName: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            isbn: "978-0743273565",
            publisher: "Scribner",
            language: "English",
            bookCountAvailable: 4,
            categories: [categories[0]._id, categories[6]._id],
            description: "The story of the mysteriously wealthy Jay Gatsby.",
          },
          {
            bookName: "Sapiens: A Brief History of Humankind",
            author: "Yuval Noah Harari",
            isbn: "978-0062316097",
            publisher: "Harper",
            language: "English",
            bookCountAvailable: 6,
            categories: [categories[1]._id, categories[5]._id],
            description: "A groundbreaking narrative of humanity's creation.",
          },
          {
            bookName: "A Brief History of Time",
            author: "Stephen Hawking",
            isbn: "978-0553380163",
            publisher: "Bantam",
            language: "English",
            bookCountAvailable: 2,
            categories: [categories[2]._id],
            description: "From the Big Bang to black holes.",
          },
          {
            bookName: "Atomic Habits",
            author: "James Clear",
            isbn: "978-0735211292",
            publisher: "Avery",
            language: "English",
            bookCountAvailable: 7,
            categories: [categories[7]._id],
            description: "Build good habits and break bad ones.",
          },
          {
            bookName: "To Kill a Mockingbird",
            author: "Harper Lee",
            isbn: "978-0061120084",
            publisher: "Harper Perennial",
            language: "English",
            bookCountAvailable: 5,
            categories: [categories[0]._id, categories[6]._id],
            description: "A childhood in a sleepy Southern town.",
          },
          {
            bookName: "Python Crash Course",
            author: "Eric Matthes",
            isbn: "978-1593279288",
            publisher: "No Starch Press",
            language: "English",
            bookCountAvailable: 4,
            categories: [categories[3]._id],
            description: "A hands-on introduction to programming with Python.",
          },
        ]);

        // Update categories with book references
        for (const book of books) {
          if (book.categories && book.categories.length > 0) {
            await BookCategory.updateMany(
              { _id: { $in: book.categories } },
              { $push: { books: book._id } }
            );
          }
        }
        console.log("📚 Created 8 sample books");
      } else {
        console.log(`📚 Books already exist (${bookCount} found), skipping`);
      }
    } else {
      console.log(`📂 Categories already exist (${categoryCount} found), skipping`);
    }

    console.log("\n🎉 Production seed complete!");
    console.log("\n📋 Demo Login Credentials:");
    console.log("  Admin:     admin@library.com / admin123");
    console.log("  Librarian: librarian@library.com / librarian123");
    console.log("  Member:    student@library.com / member123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seedIfNeeded();
