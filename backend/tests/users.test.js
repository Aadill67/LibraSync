/**
 * User Route Tests
 * Tests: profile, approval, suspension, password change, deletion
 */
import { jest } from "@jest/globals";
import supertest from "supertest";
import app from "../server.js";
import { connectDB, clearDB, closeDB, createTestUser } from "./setup.js";

const request = supertest(app);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("GET /api/users/getuser/:id", () => {
  it("should return user profile by ID", async () => {
    const { user, token } = await createTestUser({
      userFullName: "Profile User",
      email: "profile@test.com",
    });

    const res = await request
      .get(`/api/users/getuser/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userFullName).toBe("Profile User");
    expect(res.body.email).toBe("profile@test.com");
    // Password should never be returned
    expect(res.body.password).toBeUndefined();
  });

  it("should return 404 for non-existent user", async () => {
    const { token } = await createTestUser();
    const fakeId = "507f1f77bcf86cd799439011";

    const res = await request
      .get(`/api/users/getuser/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/users/updateuser/:id", () => {
  it("should update own profile", async () => {
    const { user, token } = await createTestUser({
      userFullName: "Old Name",
    });

    const res = await request
      .put(`/api/users/updateuser/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ userFullName: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.userFullName).toBe("New Name");
  });
});

describe("GET /api/users/allmembers", () => {
  it("should return all members for staff", async () => {
    const { token } = await createTestUser({ role: "admin" });
    await createTestUser({ email: "member1@test.com", role: "member" });
    await createTestUser({ email: "member2@test.com", role: "member" });

    const res = await request
      .get("/api/users/allmembers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe("PUT /api/users/approve/:id", () => {
  it("should approve a pending member", async () => {
    const { token } = await createTestUser({ role: "admin" });
    const { user: pendingUser } = await createTestUser({
      email: "pending@test.com",
      role: "member",
      accountStatus: "pending",
    });

    const res = await request
      .put(`/api/users/approve/${pendingUser._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.accountStatus).toBe("active");
  });
});

describe("PUT /api/users/suspend/:id", () => {
  it("should suspend an active member", async () => {
    const { token } = await createTestUser({ role: "admin" });
    const { user: activeUser } = await createTestUser({
      email: "active@test.com",
      role: "member",
      accountStatus: "active",
    });

    const res = await request
      .put(`/api/users/suspend/${activeUser._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.accountStatus).toBe("suspended");
  });
});

describe("PUT /api/users/change-password", () => {
  it("should change password with correct current password", async () => {
    const { token } = await createTestUser({
      email: "pwchange@test.com",
      password: "oldpassword123",
    });

    const res = await request
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "oldpassword123",
        newPassword: "newpassword456",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/changed|updated|success/i);
  });

  it("should reject change with wrong current password", async () => {
    const { token } = await createTestUser({
      email: "pwwrong@test.com",
      password: "correctpass",
    });

    const res = await request
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "wrongpass",
        newPassword: "newpassword456",
      });

    // API returns 400 for incorrect current password
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/incorrect|invalid|wrong/i);
  });
});

describe("DELETE /api/users/deleteuser/:id", () => {
  it("should delete a user when authenticated as admin", async () => {
    const { token } = await createTestUser({ role: "admin" });
    const { user: toDelete } = await createTestUser({
      email: "delete@test.com",
      role: "member",
    });

    const res = await request
      .delete(`/api/users/deleteuser/${toDelete._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted|removed/i);
  });

  it("should reject deletion by non-admin", async () => {
    const { token } = await createTestUser({
      role: "librarian",
      email: "lib@test.com",
    });
    const { user: target } = await createTestUser({
      email: "target@test.com",
      role: "member",
    });

    const res = await request
      .delete(`/api/users/deleteuser/${target._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
