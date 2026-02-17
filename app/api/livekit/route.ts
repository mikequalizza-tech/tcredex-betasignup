import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details from database
    const supabaseAdmin = getSupabaseAdmin();
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', authUser.id)
      .single();

    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room');

    if (!room) {
      return NextResponse.json({ error: 'Room parameter required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: 'LiveKit configuration missing' },
        { status: 500 }
      );
    }

    const name = userRecord?.name || authUser.email?.split('@')[0] || 'User';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: authUser.id,
      name: name,
    });

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[LiveKit] Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
