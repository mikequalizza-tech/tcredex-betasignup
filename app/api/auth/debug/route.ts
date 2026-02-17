/**
 * Debug endpoint to check auth state
 * SIMPLIFIED: Uses users - no organization FK joins
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const cookieToken = request.cookies.get('auth-token')?.value

  if (!cookieToken) {
    return NextResponse.json({ error: 'No auth token' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: userResult, error: userError } = await supabase.auth.getUser(cookieToken)

    if (userError || !userResult?.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const authUser = userResult.user

    // Get user data from users table
    const { data: user, error: userQueryError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    type UserRecord = {
      id: string;
      organization_id: string | null;
      role_type: string | null;
      name: string | null;
      role: string | null;
    };
    const typedUser = user as UserRecord | null;

    // Get organization details if user has org
    let organization = null;
    if (typedUser?.organization_id && typedUser?.role_type) {
      const tableName = typedUser.role_type === 'sponsor' ? 'sponsors'
        : typedUser.role_type === 'investor' ? 'investors'
        : 'cdes';
      const { data: org, error: orgError } = await supabase
        .from(tableName)
        .select('primary_contact_name')
        .eq('organization_id', typedUser.organization_id)
        .single();

      organization = {
        data: org,
        error: orgError
      };
    }

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        metadata: authUser.user_metadata
      },
      profile: {
        data: user,
        error: userQueryError
      },
      organization,
      debug: {
        hasProfile: !!user,
        hasOrgId: !!typedUser?.organization_id,
        orgId: typedUser?.organization_id,
        orgType: typedUser?.role_type
      }
    })
  } catch (error) {
    console.error('[Debug] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
