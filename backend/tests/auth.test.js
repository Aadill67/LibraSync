/**
 * Auth Route Tests
 * Tests: register, login, forgot-password, logout
 */
import { jest } from "@jest/globals";
import supertest from "supertest";
import app from "../server.js";
import { connectDB, clearDB, closeDB, createTestUser } from "./setup.js";

const request = supertest(app);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("POST /api/auth/register", () => {
  it("should register a new user successfully", async () => {
    const res = await request.post("/api/auth/register").send({
      userFullName: "John Doe",
      email: "john@library.com",
      password: "password123",
      mobileNumber: "9876543210",
      role: "member",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("_id");
    expect(res.body.userFullName).toBe("John Doe");
    expect(res.body.email).toBe("john@library.com");
    expect(res.body.role).toBe("member");
    // Password should NOT be in the response
    expect(res.body.password).toBeUndefined();
  });

  it("should reject registration with duplicate email", async () => {
    await createTestUser({ email: "dupe@library.com" });

    const res = await request.post("/api/auth/register").send({
      userFullName: "Another User",
      email: "dupe@library.com",
      password: "password123",
      mobileNumber: "9876543211",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  it("should reject registration with missing required fields", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "incomplete@library.com",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/signin", () => {
  it("should login with valid credentials", async () => {
    await createTestUser({
      email: "login@library.com",
      password: "password123",
      role: "admin",
      accountStatus: "active",
    });

    const res = await request.post("/api/auth/signin").send({
      email: "login@library.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.email).toBe("login@library.com");
  });

  it("should reject login with wrong password", async () => {
    await createTestUser({
      email: "wrong@library.com",
      password: "correctpass",
    });

    const res = await request.post("/api/auth/signin").send({
      email: "wrong@library.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid|incorrect|wrong/i);
  });

  it("should reject login for pending member accounts", async () => {
    await createTestUser({
      email: "pending@library.com",
      password: "password123",
      role: "member",
      accountStatus: "pending",
    });

    const res = await request.post("/api/auth/signin").send({
      email: "pending@library.com",
      password: "password123",
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/pending|approv/i);
  });

  it("should reject login for non-existent user", async () => {
    const res = await request.post("/api/auth/signin").send({
      email: "noone@library.com",
      password: "password123",
    });

    expect(res.status).toBe(404);
  });
});

describe("POST /api/auth/logout", () => {
  it("should clear the refresh token cookie", async () => {
    const res = await request.post("/api/auth/logout");

    expect(res.status).toBe(200);
    const cookies = res.headers["set-cookie"];
    if (cookies) {
      const refreshCookie = cookies.find((c) => c.startsWith("refreshToken"));
      if (refreshCookie) {
        expect(refreshCookie).toMatch(/Max-Age=0|expires=Thu, 01 Jan 1970/i);
      }
    }
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("should return success even for non-existent email (anti-enumeration)", async () => {
    const res = await request.post("/api/auth/forgot-password").send({
      email: "nonexistent@library.com",
    });

    // Should not reveal whether the email exists
    expect(res.status).toBe(200);
  });
});
