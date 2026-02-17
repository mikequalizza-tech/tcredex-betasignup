/**
 * tCredex Users API
 * User management with proper auth and org filtering
 * SIMPLIFIED: Uses users - no organization FK joins
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireOrgAdmin, handleAuthError } from '@/lib/api/auth-middleware';

// =============================================================================
// GET /api/users - List team members in user's organization
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const _user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');


    // Get specific user (role-driven only)
    if (id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ user: data });
    }

    // List all users (role-driven only)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ users: data || [] });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/users - Create team member (org admin only)
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require org admin
    const user = await requireOrgAdmin(request);
    const supabase = getSupabaseAdmin();

    const body = await request.json();

    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'email and name are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'];
    if (body.role && !validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }


    const lowerEmail = body.email.toLowerCase();

    // Check if user already exists in users table
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', lowerEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Fetch inviter's org info to propagate
    const { data: inviterData } = await supabase
      .from('users')
      .select('organization_name, role_type')
      .eq('id', user.id)
      .single();

    // Step 1: Create Supabase Auth account + send invite email
    let authUserId: string;

    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      lowerEmail,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tcredex.com'}/auth/callback?redirect=/dashboard`,
        data: { full_name: body.name, role: body.role || 'MEMBER' },
      }
    );

    if (authError) {
      if (authError.message?.toLowerCase().includes('already')) {
        const { data: userList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = userList?.users?.find(u => u.email?.toLowerCase() === lowerEmail);
        if (!found) {
          return NextResponse.json({ error: 'User has an auth account but could not be resolved' }, { status: 400 });
        }
        authUserId = found.id;
      } else {
        return NextResponse.json({ error: authError.message || 'Failed to send invitation' }, { status: 400 });
      }
    } else {
      authUserId = authData.user.id;
    }

    // Step 2: Create users table record linked to auth account
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: lowerEmail,
        name: body.name,
        role: body.role || 'MEMBER',
        phone: body.phone,
        title: body.title,
        avatar_url: body.avatar_url,
        organization_id: user.organizationId,
        organization_name: inviterData?.organization_name || null,
        role_type: inviterData?.role_type || null,
        is_active: true,
        email_verified: false,
      } as never)
      .select('*')
      .single();

    if (error) throw error;

    // Log to ledger
    try {
      await supabase.from('ledger_events').insert({
        actor_type: 'human',
        actor_id: user.id,
        entity_type: 'user',
        entity_id: authUserId,
        action: 'user_created',
        payload_json: { email: lowerEmail, name: body.name },
      } as never);
    } catch (_e) {
      // Ledger logging is optional
    }

    return NextResponse.json({ success: true, user: data }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
