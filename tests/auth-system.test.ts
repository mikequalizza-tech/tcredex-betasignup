/**
 * Comprehensive Auth & Roles System Tests
 * Tests all critical functionality from Phase 1
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://127.0.0.1:8080/api";

interface TestUser {
  email: string;
  password: string;
  name: string;
  organizationName: string;
  role: "sponsor" | "cde" | "investor";
  token?: string;
  userId?: string;
  orgId?: string;
}

// Test users
const testUsers: Record<string, TestUser> = {
  sponsor1: {
    email: `sponsor1-${Date.now()}@test.com`,
    password: "TestPassword123!",
    name: "Test Sponsor 1",
    organizationName: `Sponsor Org 1 ${Date.now()}`,
    role: "sponsor",
  },
  sponsor2: {
    email: `sponsor2-${Date.now()}@test.com`,
    password: "TestPassword123!",
    name: "Test Sponsor 2",
    organizationName: `Sponsor Org 2 ${Date.now()}`,
    role: "sponsor",
  },
  cde: {
    email: `cde-${Date.now()}@test.com`,
    password: "TestPassword123!",
    name: "Test CDE",
    organizationName: `CDE Org ${Date.now()}`,
    role: "cde",
  },
  investor: {
    email: `investor-${Date.now()}@test.com`,
    password: "TestPassword123!",
    name: "Test Investor",
    organizationName: `Investor Org ${Date.now()}`,
    role: "investor",
  },
};

// Helper functions
async function register(user: TestUser): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.user.id).toBeDefined();
  expect(data.user.organizationId).toBeDefined();

  user.userId = data.user.id;
  user.orgId = data.user.organizationId;
}

async function login(user: TestUser): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.user.id).toBeDefined();

  user.token = data.user.id; // Using user ID as token for testing
}

async function getMe(token: string): Promise<Response> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return response;
}

async function createDeal(
  token: string,
  dealData: Record<string, unknown>,
): Promise<Response> {
  const response = await fetch(`${API_BASE}/deals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dealData),
  });

  return response;
}

async function getDeals(token: string): Promise<Response> {
  const response = await fetch(`${API_BASE}/deals`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return response;
}

async function getDeal(token: string, dealId: string): Promise<Response> {
  const response = await fetch(`${API_BASE}/deals?id=${dealId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return response;
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe("Auth & Roles System - Phase 1 Tests", () => {
  // =========================================================================
  // TEST GROUP 1: Registration Flow
  // =========================================================================

  describe("1. Registration Flow", () => {
    it("1.1 Should register sponsor successfully", async () => {
      await register(testUsers.sponsor1);
      expect(testUsers.sponsor1.userId).toBeDefined();
      expect(testUsers.sponsor1.orgId).toBeDefined();
    });

    it("1.2 Should register CDE successfully", async () => {
      await register(testUsers.cde);
      expect(testUsers.cde.userId).toBeDefined();
      expect(testUsers.cde.orgId).toBeDefined();
    });

    it("1.3 Should register investor successfully", async () => {
      await register(testUsers.investor);
      expect(testUsers.investor.userId).toBeDefined();
      expect(testUsers.investor.orgId).toBeDefined();
    });

    it("1.4 Should reject registration with missing fields", async () => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("1.5 Should reject registration with invalid role", async () => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@test.com",
          password: "password",
          name: "Test",
          organizationName: "Test Org",
          role: "invalid",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid role");
    });
  });

  // =========================================================================
  // TEST GROUP 2: Login Flow
  // =========================================================================

  describe("2. Login Flow", () => {
    beforeAll(async () => {
      await register(testUsers.sponsor2);
    });

    it("2.1 Should login with correct credentials", async () => {
      await login(testUsers.sponsor2);
      expect(testUsers.sponsor2.token).toBeDefined();
    });

    it("2.2 Should reject login with wrong password", async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUsers.sponsor2.email,
          password: "WrongPassword",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Invalid email or password");
    });

    it("2.3 Should reject login with non-existent email", async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@test.com",
          password: "TestPassword123!",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Invalid email or password");
    });

    it("2.4 Should reject login with missing fields", async () => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  // =========================================================================
  // TEST GROUP 3: Session Validation
  // =========================================================================

  describe("3. Session Validation", () => {
    beforeAll(async () => {
      await register(testUsers.sponsor1);
      await login(testUsers.sponsor1);
    });

    it("3.1 Should get current user with valid token", async () => {
      const response = await getMe(testUsers.sponsor1.token!);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.id).toBe(testUsers.sponsor1.userId);
      expect(data.user.email).toBe(testUsers.sponsor1.email);
      expect(data.user.organization.type).toBe("sponsor");
    });

    it("3.2 Should reject request without token", async () => {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("No authentication token");
    });

    it("3.3 Should reject request with invalid token", async () => {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        headers: { Authorization: "Bearer invalid-token" },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Invalid or expired token");
    });
  });

  // =========================================================================
  // TEST GROUP 4: Organization Filtering
  // =========================================================================

  describe("4. Organization Filtering", () => {
    let sponsor1Deal: { id: string; sponsor_organization_id?: string };

    beforeAll(async () => {
      // Register and login sponsor 1
      await register(testUsers.sponsor1);
      await login(testUsers.sponsor1);

      // Create a deal as sponsor 1
      const dealResponse = await createDeal(testUsers.sponsor1.token!, {
        project_name: "Sponsor 1 Deal",
        city: "New York",
        state: "NY",
        programs: ["NMTC"],
      });

      expect(dealResponse.status).toBe(201);
      sponsor1Deal = await dealResponse.json();

      // Register and login sponsor 2
      await register(testUsers.sponsor2);
      await login(testUsers.sponsor2);
    });

    it("4.1 Sponsor 1 should see their own deals", async () => {
      const response = await getDeals(testUsers.sponsor1.token!);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.deals.length).toBeGreaterThan(0);
      expect(data.deals[0].sponsor_organization_id).toBe(
        testUsers.sponsor1.orgId,
      );
    });

    it("4.2 Sponsor 2 should NOT see Sponsor 1 deals", async () => {
      const response = await getDeal(
        testUsers.sponsor2.token!,
        sponsor1Deal.id,
      );
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("do not have access");
    });

    it("4.3 Sponsor 2 should see only their own deals", async () => {
      const response = await getDeals(testUsers.sponsor2.token!);
      expect(response.status).toBe(200);
      const data = await response.json();
      // Sponsor 2 should have no deals (just registered)
      expect(data.deals.length).toBe(0);
    });

    it("4.4 Sponsor 2 can create their own deal", async () => {
      const response = await createDeal(testUsers.sponsor2.token!, {
        project_name: "Sponsor 2 Deal",
        city: "Los Angeles",
        state: "CA",
        programs: ["NMTC"],
      });

      expect(response.status).toBe(201);
      const deal = await response.json();
      expect(deal.sponsor_organization_id).toBe(testUsers.sponsor2.orgId);
    });
  });

  // =========================================================================
  // TEST GROUP 5: Role Validation
  // =========================================================================

  describe("5. Role Validation", () => {
    beforeAll(async () => {
      await register(testUsers.sponsor1);
      await login(testUsers.sponsor1);
    });

    it("5.1 ORG_ADMIN should be able to create deals", async () => {
      const response = await createDeal(testUsers.sponsor1.token!, {
        project_name: "Test Deal",
        city: "New York",
        state: "NY",
        programs: ["NMTC"],
      });

      expect(response.status).toBe(201);
    });

    it("5.2 ORG_ADMIN should be able to invite team members", async () => {
      const response = await fetch(`${API_BASE}/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testUsers.sponsor1.token}`,
        },
        body: JSON.stringify({
          email: `team-${Date.now()}@test.com`,
          name: "Team Member",
          role: "MEMBER",
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  // =========================================================================
  // TEST GROUP 6: Error Handling
  // =========================================================================

  describe("6. Error Handling", () => {
    it("6.1 Should return 400 for missing required fields", async () => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("6.2 Should return 401 for unauthenticated requests", async () => {
      const response = await fetch(`${API_BASE}/deals`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
    });

    it("6.3 Should return 403 for unauthorized requests", async () => {
      await register(testUsers.sponsor1);
      await login(testUsers.sponsor1);

      // Create a deal
      const dealResponse = await createDeal(testUsers.sponsor1.token!, {
        project_name: "Test Deal",
        city: "New York",
        state: "NY",
        programs: ["NMTC"],
      });

      const deal = await dealResponse.json();

      // Try to access with different user
      await register(testUsers.sponsor2);
      await login(testUsers.sponsor2);

      const response = await getDeal(testUsers.sponsor2.token!, deal.id);
      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // TEST GROUP 7: Data Consistency
  // =========================================================================

  describe("7. Data Consistency", () => {
    it("7.1 User record should exist after registration", async () => {
      const user = {
        email: `consistency-${Date.now()}@test.com`,
        password: "TestPassword123!",
        name: "Consistency Test",
        organizationName: `Consistency Org ${Date.now()}`,
        role: "sponsor" as const,
      };

      // Register
      const registerResponse = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expect(registerResponse.status).toBe(200);
      const registerData = await registerResponse.json();

      // Login to verify user record exists
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
        }),
      });

      expect(loginResponse.status).toBe(200);
      const loginData = await loginResponse.json();
      expect(loginData.user.id).toBe(registerData.user.id);
      expect(loginData.user.organizationId).toBe(
        registerData.user.organizationId,
      );
    });

    it("7.2 Organization type should match role", async () => {
      const user = {
        email: `org-type-${Date.now()}@test.com`,
        password: "TestPassword123!",
        name: "Org Type Test",
        organizationName: `Org Type Org ${Date.now()}`,
        role: "cde" as const,
      };

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await response.json();
      expect(data.user.organizationType).toBe("cde");
    });

    it("7.3 User role should be ORG_ADMIN after registration", async () => {
      const user = {
        email: `user-role-${Date.now()}@test.com`,
        password: "TestPassword123!",
        name: "User Role Test",
        organizationName: `User Role Org ${Date.now()}`,
        role: "sponsor" as const,
      };

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await response.json();
      expect(data.user.role).toBe("ORG_ADMIN");
    });

    it("7.4 Should register via /auth/signup", async () => {
      const user = {
        email: `signup-${Date.now()}@test.com`,
        password: "TestPassword123!",
        name: "Signup Test",
        organizationName: `Signup Org ${Date.now()}`,
        role: "investor" as const,
      };
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.organizationType).toBe("investor");
    });

    it("7.5 Should register via /onboarding", async () => {
      const user = {
        email: `onboarding-${Date.now()}@test.com`,
        password: "TestPassword123!",
        name: "Onboarding Test",
        organizationName: `Onboarding Org ${Date.now()}`,
        role: "sponsor" as const,
      };
      const response = await fetch(`${API_BASE}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.organizationType).toBe("sponsor");
    });
  });
});
