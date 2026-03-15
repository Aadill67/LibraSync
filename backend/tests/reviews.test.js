/**
 * Review Route Tests
 * Tests: add, upsert, get by book, delete, rating recalculation
 *
 * Routes:
 *   POST   /api/reviews/          — add/update review
 *   GET    /api/reviews/book/:id  — get reviews for book
 *   DELETE /api/reviews/:id       — delete review
 */
import { jest } from "@jest/globals";
import supertest from "supertest";
import app from "../server.js";
import {
  connectDB, clearDB, closeDB,
  createTestUser, createTestBook,
} from "./setup.js";
import Book from "../models/Book.js";

const request = supertest(app);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("POST /api/reviews/", () => {
  it("should add a review for a book", async () => {
    const { token } = await createTestUser({
      role: "member",
      accountStatus: "active",
    });
    const book = await createTestBook({ bookName: "Reviewed Book" });

    const res = await request
      .post("/api/reviews/")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId: book._id.toString(),
        rating: 4,
        comment: "Great book, loved it!",
      });

    expect(res.status).toBe(201);
    // Response is the review object directly (populated)
    expect(res.body.rating).toBe(4);
  });

  it("should upsert when the same user reviews the same book again", async () => {
    const { token } = await createTestUser({
      role: "member",
      accountStatus: "active",
    });
    const book = await createTestBook({ bookName: "Double Review Book" });

    // First review
    await request
      .post("/api/reviews/")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId: book._id.toString(),
        rating: 3,
        comment: "Okay book",
      });

    // Updated review
    const res = await request
      .post("/api/reviews/")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId: book._id.toString(),
        rating: 5,
        comment: "Actually, it was amazing!",
      });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
  });

  it("should update the book's average rating after reviews", async () => {
    const { token: token1 } = await createTestUser({
      role: "member",
      email: "reviewer1@test.com",
      accountStatus: "active",
    });
    const { token: token2 } = await createTestUser({
      role: "member",
      email: "reviewer2@test.com",
      accountStatus: "active",
    });
    const book = await createTestBook({ bookName: "Rating Test Book" });

    // User 1 gives 4 stars
    await request
      .post("/api/reviews/")
      .set("Authorization", `Bearer ${token1}`)
      .send({ bookId: book._id.toString(), rating: 4 });

    // User 2 gives 2 stars
    await request
      .post("/api/reviews/")
      .set("Authorization", `Bearer ${token2}`)
      .send({ bookId: book._id.toString(), rating: 2 });

    // Check book's average rating: (4 + 2) / 2 = 3
    const updatedBook = await Book.findById(book._id);
    expect(updatedBook.avgRating).toBe(3);
    expect(updatedBook.ratingsCount).toBe(2);
  });
});

describe("GET /api/reviews/book/:bookId", () => {
  it("should return reviews for a specific book", async () => {
    const { token } = await createTestUser({
      role: "member",
      accountStatus: "active",
    });
    const book = await createTestBook({ bookName: "Fetch Reviews Book" });

    // Add a review first
    await request
      .post("/api/reviews/")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId: book._id.toString(),
        rating: 5,
        comment: "Excellent!",
      });

    const res = await request.get(`/api/reviews/book/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0].rating).toBe(5);
    expect(res.body).toHaveProperty("stats");
  });

  it("should return empty reviews for a book with no reviews", async () => {
    const book = await createTestBook({ bookName: "No Reviews Book" });

    const res = await request.get(`/api/reviews/book/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(0);
  });
});

describe("DELETE /api/reviews/:id", () => {
  it("should delete own review and update book rating", async () => {
    const { token } = await createTestUser({
      role: "member",
      accountStatus: "active",
    });
    const book = await createTestBook({ bookName: "Delete Review Book" });

    // Add a review
    const addRes = await request
      .post("/api/reviews/")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId: book._id.toString(),
        rating: 3,
        comment: "To be deleted",
      });

    const reviewId = addRes.body._id;

    // Delete it
    const res = await request
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted|removed/i);

    // Verify book's rating is reset
    const updatedBook = await Book.findById(book._id);
    expect(updatedBook.ratingsCount).toBe(0);
  });
});
