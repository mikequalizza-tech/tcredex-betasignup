import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { recordAuditEvent } from '@/lib/utils/audit'

const SESSION_TTL_SECONDS = 60 * 60 * 24

export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token') || ''
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Validate token and get user
    const { data: userResult, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userResult?.user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const user = userResult.user

    // Fetch profile (role-driven only)
    const { data: profileData, error: _profileError } = await supabase
      .from('users')
      .select('id, role, name')
      .eq('id', user.id)
      .single()

    type ProfileData = {
      id: string
      role: string | null
      name: string | null
    }
    const profile = profileData as ProfileData | null

    const userName = user.user_metadata?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: userName,
        role: profile?.role || 'sponsor',
      },
    })

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: SESSION_TTL_SECONDS,
      path: '/',
    }

    response.cookies.set({ name: 'auth-token', value: token, ...cookieOptions })
    response.cookies.set({ name: 'tcredex_session', value: token, ...cookieOptions })

    await recordAuditEvent({
      action: 'email_confirmed',
      userId: user.id,
      role: profile?.role || 'sponsor',
    })

    return response
  } catch (error) {
    console.error('[Confirm-token] error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
