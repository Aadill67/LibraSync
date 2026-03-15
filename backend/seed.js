import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/User.js";
import Book from "./models/Book.js";
import BookCategory from "./models/BookCategory.js";

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Cannot run seed in production! This would wipe all data.');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB for seeding");

    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    await BookCategory.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const librarianPassword = await bcrypt.hash("librarian123", salt);
    const memberPassword = await bcrypt.hash("member123", salt);

    const admin = await User.create({
      userFullName: "Admin User",
      email: "admin@library.com",
      password: adminPassword,
      role: "admin",
      accountStatus: "active",
      employeeId: "EMP001",
      mobileNumber: "9876543210",
      gender: "male",
      age: 35,
    });

    const librarian = await User.create({
      userFullName: "Librarian User",
      email: "librarian@library.com",
      password: librarianPassword,
      role: "librarian",
      accountStatus: "active",
      employeeId: "EMP002",
      mobileNumber: "9876543211",
      gender: "female",
      age: 28,
    });

    const member = await User.create({
      userFullName: "Student User",
      email: "student@library.com",
      password: memberPassword,
      role: "member",
      accountStatus: "active",
      admissionId: "STU001",
      mobileNumber: "9876543212",
      gender: "male",
      age: 20,
    });

    console.log("👥 Created users (admin, librarian, member)");

    // Create categories
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

    // Create books
    const books = await Book.insertMany([
      {
        bookName: "Introduction to Algorithms",
        author: "Thomas H. Cormen",
        isbn: "978-0262033848",
        publisher: "MIT Press",
        language: "English",
        bookCountAvailable: 5,
        categories: [categories[3]._id, categories[4]._id],
        description: "A comprehensive textbook on algorithms covering sorting, searching, graph algorithms, and more.",
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
        description: "The story of the mysteriously wealthy Jay Gatsby and his love for Daisy Buchanan.",
      },
      {
        bookName: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        isbn: "978-0062316097",
        publisher: "Harper",
        language: "English",
        bookCountAvailable: 6,
        categories: [categories[1]._id, categories[5]._id],
        description: "A groundbreaking narrative of humanity's creation and evolution.",
      },
      {
        bookName: "A Brief History of Time",
        author: "Stephen Hawking",
        isbn: "978-0553380163",
        publisher: "Bantam",
        language: "English",
        bookCountAvailable: 2,
        categories: [categories[2]._id],
        description: "From the Big Bang to black holes, Hawking explores the universe.",
      },
      {
        bookName: "The Pragmatic Programmer",
        author: "Andrew Hunt",
        isbn: "978-0135957059",
        publisher: "Addison-Wesley",
        language: "English",
        bookCountAvailable: 3,
        categories: [categories[3]._id],
        description: "Your journey to mastery in software development.",
      },
      {
        bookName: "Atomic Habits",
        author: "James Clear",
        isbn: "978-0735211292",
        publisher: "Avery",
        language: "English",
        bookCountAvailable: 7,
        categories: [categories[7]._id],
        description: "An easy and proven way to build good habits and break bad ones.",
      },
      {
        bookName: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "978-0061120084",
        publisher: "Harper Perennial",
        language: "English",
        bookCountAvailable: 5,
        categories: [categories[0]._id, categories[6]._id],
        description: "The unforgettable novel of a childhood in a sleepy Southern town.",
      },
      {
        bookName: "Python Crash Course",
        author: "Eric Matthes",
        isbn: "978-1593279288",
        publisher: "No Starch Press",
        language: "English",
        bookCountAvailable: 4,
        categories: [categories[3]._id],
        description: "A hands-on, project-based introduction to programming with Python.",
      },
      {
        bookName: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        isbn: "978-0374533557",
        publisher: "Farrar, Straus and Giroux",
        language: "English",
        bookCountAvailable: 3,
        categories: [categories[1]._id, categories[7]._id],
        description: "Exploration of the two systems that drive the way we think.",
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

    console.log("📚 Created 10 books with category references");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("  Admin:     admin@library.com / admin123");
    console.log("  Librarian: librarian@library.com / librarian123");
    console.log("  Member:    student@library.com / member123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

seedDatabase();
