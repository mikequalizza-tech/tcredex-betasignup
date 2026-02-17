import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    // Find user by Supabase Auth ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        organization_id,
        role_type,
        organization_name,
        avatar_url,
        title,
        phone,
        is_active,
        email_verified,
        last_login_at,
        created_at
      `)
      .eq('id', authUser.id)
      .single();

    if (!userRecord) {
      // User authenticated with Supabase but not in our database
      return NextResponse.json({
        user: null,
        authUser: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.first_name,
        },
        needsRegistration: true,
      });
    }

    // Return user record (role-driven, no org logic)
    return NextResponse.json({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
        organizationId: userRecord.organization_id,
        organizationName: userRecord.organization_name,
        roleType: userRecord.role_type,
        avatar: userRecord.avatar_url,
        title: userRecord.title,
        phone: userRecord.phone,
        isActive: userRecord.is_active,
        emailVerified: userRecord.email_verified,
        lastLoginAt: userRecord.last_login_at,
        createdAt: userRecord.created_at,
      },
    });
  } catch (error) {
    console.error('[API] /api/auth/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

