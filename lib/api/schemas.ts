import { z } from "zod";

// ============================================================================
// Auth Schemas
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(200),
  role: z.enum(["sponsor", "cde", "investor"]),
  organizationName: z.string().min(1, "Organization name is required").max(500),
  existingOrgId: z.string().uuid().optional(),
  referralDealId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const claimSchema = z.object({
  code: z.string().min(1, "Claim code is required").max(20),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ============================================================================
// Contact Schema
// ============================================================================

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(50).optional(),
  company: z.string().max(500).optional(),
  topic: z.string().min(1, "Topic is required").max(200),
  projectType: z.string().max(200).optional(),
  allocation: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(10000),
  type: z.enum(["platform_support", "aiv_advisory"]).optional(),
});

// ============================================================================
// Deal Schemas
// ============================================================================

export const createDealSchema = z
  .object({
    project_name: z.string().min(1, "Project name is required").max(500),
    programs: z.array(z.string()).min(1, "At least one program required"),
    state: z.string().max(100).optional(),
    city: z.string().max(200).optional(),
    address: z.string().max(500).optional(),
    zip_code: z.string().max(20).optional(),
    intake_data: z.record(z.unknown()).optional(),
    draft_data: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const updateDealSchema = z
  .object({
    project_name: z.string().min(1).max(500).optional(),
    status: z.string().max(50).optional(),
    programs: z.array(z.string()).optional(),
    intake_data: z.record(z.unknown()).optional(),
    draft_data: z.record(z.unknown()).optional(),
    tier: z.number().int().min(0).max(3).optional(),
    readiness_score: z.number().min(0).max(100).optional(),
  })
  .passthrough();

// ============================================================================
// Outreach Schema
// ============================================================================

export const outreachSchema = z
  .object({
    recipientIds: z
      .array(z.string())
      .min(1, "At least one recipient required")
      .max(3),
    recipientType: z.enum(["cde", "investor"]),
    message: z.string().max(5000).optional(),
    senderName: z.string().max(200).optional(),
    senderOrg: z.string().max(500).optional(),
  })
  .passthrough();

// ============================================================================
// Match Request Schemas (camelCase — matches client body format)
// ============================================================================

export const matchRequestCreateSchema = z.object({
  dealId: z.string().uuid("Invalid deal ID"),
  targetType: z.enum(["cde", "investor"]),
  targetId: z.string().uuid("Invalid target ID"),
  message: z.string().max(5000).optional(),
});

export const matchRequestActionSchema = z.object({
  action: z.enum(["accept", "decline", "withdraw"]),
  message: z.string().max(5000).optional(),
});

// ============================================================================
// LOI / Commitment Schemas
// ============================================================================

export const loiInputSchema = z.object({
  input: z
    .object({
      deal_id: z.string().uuid(),
      cde_id: z.string().uuid(),
      allocation_amount: z
        .number()
        .positive("Allocation amount must be positive"),
      terms: z.string().max(10000).optional(),
      expires_at: z.string().optional(),
    })
    .passthrough(),
});

export const commitmentInputSchema = z.object({
  input: z
    .object({
      deal_id: z.string().uuid(),
      investor_id: z.string().uuid(),
      investment_amount: z
        .number()
        .positive("Investment amount must be positive"),
      credit_type: z.string().min(1, "Credit type is required"),
      cde_id: z.string().uuid().optional(),
      terms: z.string().max(10000).optional(),
    })
    .passthrough(),
});

// ============================================================================
// Message Schema (camelCase — matches client body format)
// ============================================================================

export const messageCreateSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
  content: z.string().min(1, "Message cannot be empty").max(10000),
  senderId: z.string().uuid().optional(),
  senderName: z.string().max(200).optional(),
  senderOrg: z.string().max(500).optional(),
  senderOrgId: z.string().uuid().optional(),
});

// ============================================================================
// Organization Schema
// ============================================================================

export const organizationCreateSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(500),
  type: z.enum(["sponsor", "cde", "investor", "admin"]),
  contact_name: z.string().max(200).optional(),
  contact_email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
});
