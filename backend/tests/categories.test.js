/**
 * Category Route Tests
 * Tests: CRUD, cascade cleanup on delete
 */
import { jest } from "@jest/globals";
import supertest from "supertest";
import app from "../server.js";
import {
  connectDB, clearDB, closeDB,
  createTestUser, createTestBook, createTestCategory,
} from "./setup.js";
import BookCategory from "../models/BookCategory.js";

const request = supertest(app);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("GET /api/categories/allcategories", () => {
  it("should return empty array when no categories exist", async () => {
    const res = await request.get("/api/categories/allcategories");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it("should return all categories sorted alphabetically", async () => {
    await createTestCategory("Science");
    await createTestCategory("Fiction");
    await createTestCategory("Technology");

    const res = await request.get("/api/categories/allcategories");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].categoryName).toBe("Fiction");
    expect(res.body[1].categoryName).toBe("Science");
    expect(res.body[2].categoryName).toBe("Technology");
  });
});

describe("POST /api/categories/addcategory", () => {
  it("should add a new category when authenticated as staff", async () => {
    const { token } = await createTestUser({ role: "librarian" });

    const res = await request
      .post("/api/categories/addcategory")
      .set("Authorization", `Bearer ${token}`)
      .send({ categoryName: "History" });

    expect(res.status).toBe(201);
    expect(res.body.categoryName).toBe("History");
  });

  it("should reject duplicate category name", async () => {
    const { token } = await createTestUser({ role: "admin" });
    await createTestCategory("Fiction");

    const res = await request
      .post("/api/categories/addcategory")
      .set("Authorization", `Bearer ${token}`)
      .send({ categoryName: "Fiction" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already|exists|duplicate/i);
  });

  it("should reject category creation without a name", async () => {
    const { token } = await createTestUser({ role: "admin" });

    const res = await request
      .post("/api/categories/addcategory")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/categories/deletecategory/:id", () => {
  it("should delete a category (admin only)", async () => {
    const { token } = await createTestUser({ role: "admin" });
    const category = await createTestCategory("ToDelete");

    const res = await request
      .delete(`/api/categories/deletecategory/${category._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    // Verify it was actually removed
    const check = await BookCategory.findById(category._id);
    expect(check).toBeNull();
  });

  it("should clean up book category references on delete", async () => {
    const { token } = await createTestUser({ role: "admin" });
    const category = await createTestCategory("Cleanup");
    const book = await createTestBook({
      bookName: "Categorized Book",
      categories: [category._id],
    });

    // Delete the category
    await request
      .delete(`/api/categories/deletecategory/${category._id}`)
      .set("Authorization", `Bearer ${token}`);

    // Verify the book no longer references this category
    const updatedBookRes = await request.get(`/api/books/getbook/${book._id}`);
    const catIds = updatedBookRes.body.categories.map(
      (c) => c._id || c.toString()
    );
    expect(catIds).not.toContain(category._id.toString());
  });
});

describe("GET /api/categories/:id/books", () => {
  it("should return books belonging to a category", async () => {
    const category = await createTestCategory("Tech");
    await createTestBook({
      bookName: "Tech Book 1",
      categories: [category._id],
    });
    await createTestBook({
      bookName: "Tech Book 2",
      categories: [category._id],
    });

    const res = await request.get(`/api/categories/${category._id}/books`);

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(2);
    expect(res.body.category.categoryName).toBe("Tech");
  });
});
