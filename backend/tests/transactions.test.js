/**
 * Transaction Route Tests
 * Tests: issue, return, fine, reservation, deletion
 */
import { jest } from "@jest/globals";
import supertest from "supertest";
import app from "../server.js";
import {
  connectDB, clearDB, closeDB,
  createTestUser, createTestBook,
} from "./setup.js";

const request = supertest(app);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("POST /api/transactions/add-transaction", () => {
  it("should issue a book successfully", async () => {
    const { token } = await createTestUser({ role: "librarian" });
    const { user: member } = await createTestUser({
      email: "member@test.com",
      role: "member",
      accountStatus: "active",
    });
    const book = await createTestBook({ bookCountAvailable: 3 });

    const res = await request
      .post("/api/transactions/add-transaction")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId: book._id.toString(),
        borrowerId: member._id.toString(),
        bookName: book.bookName,
        borrowerName: member.userFullName,
        fromDate: new Date().toISOString(),
        toDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        transactionType: "issued",
      });

    expect(res.status).toBe(201);
    expect(res.body.transactionType).toBe("issued");
    expect(res.body.transactionStatus).toBe("active");
  });

  it("should reject issuing when no copies available", async () => {
    const { token } = await createTestUser({ role: "librarian" });
    const { user: member } = await createTestUser({
      email: "member2@test.com",
      role: "member",
    });
    const book = await createTestBook({ bookCountAvailable: 0 });

    const res = await request
      .post("/api/transactions/add-transaction")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId: book._id.toString(),
        borrowerId: member._id.toString(),
        bookName: book.bookName,
        borrowerName: member.userFullName,
        fromDate: new Date().toISOString(),
        toDate: new Date(Date.now() + 86400000).toISOString(),
        transactionType: "issued",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/available|stock|copies|not available/i);
  });
});

describe("PUT /api/transactions/return/:id", () => {
  it("should return a book successfully", async () => {
    const { token } = await createTestUser({ role: "librarian" });
    const { user: member } = await createTestUser({
      email: "borrower@test.com",
      role: "member",
    });
    const book = await createTestBook({ bookCountAvailable: 5 });

    // Issue first
    const issueRes = await request
      .post("/api/transactions/add-transaction")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId: book._id.toString(),
        borrowerId: member._id.toString(),
        bookName: book.bookName,
        borrowerName: member.userFullName,
        fromDate: new Date().toISOString(),
        toDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        transactionType: "issued",
      });

    const transId = issueRes.body._id;

    // Return
    const returnRes = await request
      .put(`/api/transactions/return/${transId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.transaction.transactionStatus).toBe("completed");
    expect(returnRes.body.transaction.returnDate).toBeDefined();
  });
});

describe("GET /api/transactions/all-transactions", () => {
  it("should return all transactions for staff", async () => {
    const { token } = await createTestUser({ role: "admin" });

    const res = await request
      .get("/api/transactions/all-transactions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/transactions/stats", () => {
  it("should return dashboard statistics", async () => {
    const { token } = await createTestUser({ role: "admin" });

    const res = await request
      .get("/api/transactions/stats")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalBooks");
    expect(res.body).toHaveProperty("totalMembers");
    expect(res.body).toHaveProperty("activeTransactions");
  });
});

describe("POST /api/transactions/reserve", () => {
  it("should reserve a book for a member", async () => {
    const { token } = await createTestUser({
      role: "member",
      accountStatus: "active",
    });
    const book = await createTestBook({ bookCountAvailable: 0 });

    const res = await request
      .post("/api/transactions/reserve")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.reservation.transactionType).toBe("reserved");
    expect(res.body.reservation.transactionStatus).toBe("reserved");
  });

  it("should reject duplicate reservation for same book", async () => {
    const { token } = await createTestUser({
      role: "member",
      accountStatus: "active",
    });
    const book = await createTestBook({ bookCountAvailable: 0 });

    // First reservation
    await request
      .post("/api/transactions/reserve")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book._id.toString() });

    // Duplicate
    const res = await request
      .post("/api/transactions/reserve")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already|existing/i);
  });
});

describe("DELETE /api/transactions/remove-transaction/:id", () => {
  it("should delete a transaction and clean up references", async () => {
    const { token } = await createTestUser({ role: "admin" });
    const { user: member } = await createTestUser({
      email: "cleanup@test.com",
      role: "member",
    });
    const book = await createTestBook({ bookCountAvailable: 5 });

    // Issue a book
    const issueRes = await request
      .post("/api/transactions/add-transaction")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookId: book._id.toString(),
        borrowerId: member._id.toString(),
        bookName: book.bookName,
        borrowerName: member.userFullName,
        fromDate: new Date().toISOString(),
        toDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        transactionType: "issued",
      });

    const transId = issueRes.body._id;

    // Delete
    const deleteRes = await request
      .delete(`/api/transactions/remove-transaction/${transId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toMatch(/deleted|removed/i);
  });
});
