/**
 * Welcome Email API
 * Sends welcome email after successful onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { email as emailService } from '@/lib/email/send';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { roleType, userName } = body;

    try {
      const normalizedRole = ['sponsor', 'cde', 'investor'].includes(String(roleType))
        ? (roleType as 'sponsor' | 'cde' | 'investor')
        : 'sponsor';

      const recipient = user.email;
      if (recipient) {
        const welcomeResult = await emailService.welcome(
          recipient,
          userName || recipient.split('@')[0] || 'User',
          normalizedRole
        );
        if (!welcomeResult.success) {
          console.warn('[Onboarding] Welcome email send failed:', welcomeResult.error);
        }
      } else {
        console.warn('[Onboarding] Missing user email; skipping welcome email');
      }
    } catch (emailError) {
      // Log but don't fail - email is not critical
      console.warn('[Onboarding] Failed to send welcome email:', emailError);
    }

    // Also log the successful onboarding
    console.log(`[Onboarding] User ${user.id} completed onboarding as ${roleType}`);

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent',
    });
  } catch (error) {
    console.error('[Onboarding] Welcome email error:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
