/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/api/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('notifications')
      .update({ read: true } as never)
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Mark all read error:', error);
      return NextResponse.json({ success: false, error: 'Failed to mark notifications as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
