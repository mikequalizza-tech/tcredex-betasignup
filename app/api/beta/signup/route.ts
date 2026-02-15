import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('beta_signups')
      .insert({ name, email: email.toLowerCase() })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Duplicate email
        return NextResponse.json({ error: 'Already on the list' }, { status: 409 });
      }
      console.error('[Beta Signup] Error:', error);
      return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('[Beta Signup] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
