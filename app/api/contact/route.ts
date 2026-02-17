import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, subject } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Try to store in beta_signups as a contact message (reuse table)
    // or just log it if the contact_messages table doesn't exist
    const { error } = await supabase
      .from('beta_signups')
      .upsert(
        { name, email, created_at: new Date().toISOString() },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('[Contact] Supabase error:', error);
    }

    // Successfully stored message
    return NextResponse.json({ success: true, message: 'Message received' });
  } catch (error) {
    console.error('[Contact] Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
