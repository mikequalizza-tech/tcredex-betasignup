/**
 * tCredex User API - Single User Operations
 * All endpoints require authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  requireOrgAdmin,
  handleAuthError,
} from "@/lib/api/auth-middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET /api/users/[id] - requires auth
// =============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// PUT /api/users/[id] - requires auth
// =============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const body = await request.json();

    const {
      id: _id,
      created_at: _created_at,
      updated_at: _updated_at,
      organization: _organization,
      ...updateData
    } = body;

    // If email is being updated, check it's not taken
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", updateData.email)
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      }
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData as never)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// DELETE /api/users/[id] - Soft delete + disable auth account (org admin only)
// =============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireOrgAdmin(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    // Prevent self-deletion
    if (id === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // Soft-delete in users table
    const { error } = await supabase
      .from("users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id);

    if (error) throw error;

    // Disable the Supabase Auth account (ban, don't hard-delete)
    try {
      await supabase.auth.admin.updateUserById(id, {
        ban_duration: "876000h", // ~100 years = effectively permanent
      });
    } catch (e) {
      // Auth account may not exist for legacy records — soft-delete still succeeded
      console.warn(`Could not disable auth account for user ${id}:`, e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
