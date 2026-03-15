/**
 * Book Route Tests
 * Tests: CRUD operations, search, QR code generation
 */
import { jest } from "@jest/globals";
import supertest from "supertest";
import app from "../server.js";
import {
  connectDB, clearDB, closeDB,
  createTestUser, createTestBook, createTestCategory,
} from "./setup.js";

const request = supertest(app);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("GET /api/books/allbooks", () => {
  it("should return empty array when no books exist", async () => {
    const res = await request.get("/api/books/allbooks");

    expect(res.status).toBe(200);
    expect(res.body.books).toBeDefined();
    expect(res.body.books).toHaveLength(0);
  });

  it("should return books with pagination info", async () => {
    await createTestBook({ bookName: "Book Alpha" });
    await createTestBook({ bookName: "Book Beta" });

    const res = await request.get("/api/books/allbooks");

    expect(res.status).toBe(200);
    expect(res.body.books.length).toBe(2);
    expect(res.body).toHaveProperty("totalPages");
    expect(res.body).toHaveProperty("currentPage");
  });

  it("should filter books by search query", async () => {
    await createTestBook({ bookName: "JavaScript Mastery", author: "JS Guru" });
    await createTestBook({ bookName: "Python Basics", author: "Py Expert" });

    const res = await request.get("/api/books/allbooks?search=javascript");

    expect(res.status).toBe(200);
    // Should find the JS book
    const bookNames = res.body.books.map((b) => b.bookName);
    expect(bookNames).toContain("JavaScript Mastery");
  });
});

describe("POST /api/books/addbook", () => {
  it("should add a book when authenticated as staff", async () => {
    const { token } = await createTestUser({ role: "librarian" });

    const res = await request
      .post("/api/books/addbook")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookName: "Clean Code",
        author: "Robert C. Martin",
        bookCountAvailable: 3,
        language: "English",
      });

    expect(res.status).toBe(201);
    expect(res.body.bookName).toBe("Clean Code");
    expect(res.body.author).toBe("Robert C. Martin");
    expect(res.body.bookCountAvailable).toBe(3);
  });

  it("should reject adding a book without authentication", async () => {
    const res = await request.post("/api/books/addbook").send({
      bookName: "Unauthorized Book",
      author: "Ghost",
    });

    expect(res.status).toBe(401);
  });

  it("should reject adding a book as a member", async () => {
    const { token } = await createTestUser({ role: "member", accountStatus: "active" });

    const res = await request
      .post("/api/books/addbook")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookName: "Member's Book",
        author: "A Member",
        bookCountAvailable: 1,
      });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/books/getbook/:id", () => {
  it("should return a specific book by ID", async () => {
    const book = await createTestBook({ bookName: "Specific Book" });

    const res = await request.get(`/api/books/getbook/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body.bookName).toBe("Specific Book");
  });

  it("should return 404 for non-existent book", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request.get(`/api/books/getbook/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/books/updatebook/:id", () => {
  it("should update a book when authenticated as staff", async () => {
    const { token } = await createTestUser({ role: "admin" });
    const book = await createTestBook({ bookName: "Old Title" });

    const res = await request
      .put(`/api/books/updatebook/${book._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ bookName: "New Title" });

    expect(res.status).toBe(200);
    expect(res.body.bookName).toBe("New Title");
  });
});

describe("DELETE /api/books/removebook/:id", () => {
  it("should delete a book when authenticated as admin", async () => {
    const { token } = await createTestUser({ role: "admin" });
    const book = await createTestBook({ bookName: "To Delete" });

    const res = await request
      .delete(`/api/books/removebook/${book._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Verify it's actually gone
    const checkRes = await request.get(`/api/books/getbook/${book._id}`);
    expect(checkRes.status).toBe(404);
  });
});

describe("GET /api/books/qr/:id", () => {
  it("should generate a QR code data URL for a book", async () => {
    const book = await createTestBook({ bookName: "QR Book" });

    const res = await request.get(`/api/books/qr/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("qrCode");
    expect(res.body.qrCode).toMatch(/^data:image\/png;base64/);
  });
});
