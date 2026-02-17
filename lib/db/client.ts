/**
 * tCredex Database Client
 * Centralized database access with typed methods
 */

import { createClient } from "@supabase/supabase-js";
import {
  DBOrganization,
  OrgType,
  DBUser,
  DBCDE,
  DBCDEAllocation,
} from "./types";

/** Generic row shape from Supabase queries with select() */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = any;

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side (uses anon key with RLS)
export const db = createClient(supabaseUrl, supabaseAnonKey);

// Server-side (bypasses RLS)
export const dbAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
);

// =============================================================================
// ORGANIZATIONS (data lives on role tables + users, no organizations table)
// =============================================================================

export const organizations = {
  /**
   * Get organization data by organization_id.
   * No organizations table exists — look up role tables (sponsors/cdes/investors).
   */
  async getById(id: string): Promise<DBOrganization | null> {
    // Try sponsors first
    const { data: sponsor } = await dbAdmin
      .from("sponsors")
      .select("organization_id, organization_name, organization_type")
      .eq("organization_id", id)
      .single();
    if (sponsor) {
      const row = sponsor as SupabaseRow;
      return {
        id: row.organization_id,
        name: (row.organization_name || "Organization") as string,
        slug: row.organization_id,
        type: "sponsor" as OrgType,
      } as DBOrganization;
    }

    // Try CDEs
    const { data: cde } = await dbAdmin
      .from("cdes")
      .select("organization_id, organization_name")
      .eq("organization_id", id)
      .single();
    if (cde) {
      const row = cde as SupabaseRow;
      return {
        id: row.organization_id,
        name: (row.organization_name || "Organization") as string,
        slug: row.organization_id,
        type: "cde" as OrgType,
      } as DBOrganization;
    }

    // Try investors
    const { data: investor } = await dbAdmin
      .from("investors")
      .select("organization_id, organization_name")
      .eq("organization_id", id)
      .single();
    if (investor) {
      const row = investor as SupabaseRow;
      return {
        id: row.organization_id,
        name: (row.organization_name || "Organization") as string,
        slug: row.organization_id,
        type: "investor" as OrgType,
      } as DBOrganization;
    }

    return null;
  },

  async getBySlug(slug: string): Promise<DBOrganization | null> {
    // Slugs are organization_ids in the consolidated schema
    return this.getById(slug);
  },

  async create(_org: Partial<DBOrganization>): Promise<DBOrganization> {
    throw new Error(
      "Organizations are created via role tables (sponsors/cdes/investors).",
    );
  },

  async update(
    _id: string,
    _updates: Partial<DBOrganization>,
  ): Promise<DBOrganization> {
    throw new Error("Organization updates happen via role tables.");
  },
};

// =============================================================================
// USERS
// =============================================================================

export const users = {
  async getById(id: string): Promise<DBUser | null> {
    const { data, error } = await dbAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;
    // Build organization from users table columns (no organizations table)
    const userData = data as SupabaseRow & DBUser;
    if (userData.organization_id) {
      userData.organization = {
        id: userData.organization_id,
        name:
          ((userData as SupabaseRow).organization_name as string) ||
          "Organization",
        slug: userData.organization_id,
        type: ((userData as SupabaseRow).role_type as OrgType) || "sponsor",
      } as DBOrganization;
    }
    return userData;
  },

  async getByEmail(email: string): Promise<DBUser | null> {
    const { data, error } = await dbAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;
    // Build organization from users table columns (no organizations table)
    const userData = data as SupabaseRow & DBUser;
    if (userData.organization_id) {
      userData.organization = {
        id: userData.organization_id,
        name:
          ((userData as SupabaseRow).organization_name as string) ||
          "Organization",
        slug: userData.organization_id,
        type: ((userData as SupabaseRow).role_type as OrgType) || "sponsor",
      } as DBOrganization;
    }
    return userData;
  },

  async create(user: Partial<DBUser>): Promise<DBUser> {
    const { data, error } = await dbAdmin
      .from("users")
      .insert(user)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<DBUser>): Promise<DBUser> {
    const { data, error } = await dbAdmin
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByOrganization(orgId: string): Promise<DBUser[]> {
    const { data, error } = await dbAdmin
      .from("users")
      .select("*")
      .eq("organization_id", orgId);
    if (error) throw error;
    return data || [];
  },
};

// =============================================================================
// CDEs
// =============================================================================

export const cdes = {
  async getById(id: string): Promise<DBCDE | null> {
    const { data, error } = await dbAdmin
      .from("cdes")
      .select(
        `
        *,
        allocations:cde_allocations(*)
      `,
      )
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;
    // Build organization from CDE's own columns (no organizations table)
    const cdeData = data as SupabaseRow & DBCDE;
    if (cdeData.organization_id) {
      cdeData.organization = {
        id: cdeData.organization_id,
        name:
          ((cdeData as SupabaseRow).organization_name as string) ||
          "Organization",
        slug: cdeData.organization_id,
        type: "cde",
      } as DBOrganization;
    }
    return cdeData;
  },

  async getByOrganization(orgId: string): Promise<DBCDE | null> {
    const { data, error } = await dbAdmin
      .from("cdes")
      .select(
        `
        *,
        allocations:cde_allocations(*)
      `,
      )
      .eq("organization_id", orgId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;
    const cdeData = data as SupabaseRow & DBCDE;
    if (cdeData.organization_id) {
      cdeData.organization = {
        id: cdeData.organization_id,
        name:
          ((cdeData as SupabaseRow).organization_name as string) ||
          "Organization",
        slug: cdeData.organization_id,
        type: "cde",
      } as DBOrganization;
    }
    return cdeData;
  },

  async list(status?: string): Promise<DBCDE[]> {
    let query = dbAdmin.from("cdes").select(`
        *,
        allocations:cde_allocations(*)
      `);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    // Build organization from CDE's own columns (no organizations table)
    return (data || []).map((cde: SupabaseRow) => ({
      ...(cde as unknown as DBCDE),
      organization: cde.organization_id
        ? ({
            id: cde.organization_id as string,
            name: (cde.organization_name as string) || "Organization",
            slug: cde.organization_id as string,
            type: "cde" as const,
          } as DBOrganization)
        : undefined,
    }));
  },

  async create(cde: Partial<DBCDE>): Promise<DBCDE> {
    const { data, error } = await dbAdmin
      .from("cdes")
      .insert(cde)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<DBCDE>): Promise<DBCDE> {
    const { data, error } = await dbAdmin
      .from("cdes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// =============================================================================
// CDE ALLOCATIONS
// =============================================================================

export const cdeAllocations = {
  async getByCDE(cdeId: string): Promise<DBCDEAllocation[]> {
    const { data, error } = await dbAdmin
      .from("cde_allocations")
      .select("*")
      .eq("cde_id", cdeId)
      .order("year", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(allocation: Partial<DBCDEAllocation>): Promise<DBCDEAllocation> {
    const { data, error } = await dbAdmin
      .from("cde_allocations")
      .insert(allocation)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    updates: Partial<DBCDEAllocation>,
  ): Promise<DBCDEAllocation> {
    const { data, error } = await dbAdmin
      .from("cde_allocations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await dbAdmin
      .from("cde_allocations")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
