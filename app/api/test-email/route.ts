/**
 * tCredex API - Test Email
 * POST /api/test-email
 * 
 * Quick endpoint to test Resend integration
 * DELETE THIS IN PRODUCTION
 */

import { NextRequest, NextResponse } from 'next/server';
import { email } from '@/lib/email';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { to, template } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address (to) is required' },
        { status: 400 }
      );
    }

    let result;

    switch (template) {
      case 'welcome':
        result = await email.welcome(to, 'Test User', 'sponsor');
        break;

      case 'deal_submitted':
        result = await email.dealSubmitted(to, 'Test User', 'Test Project', 'test-123');
        break;

      case 'cde_match':
        result = await email.cdeMatch(to, 'Test User', 'Test Project', 'Midwest CDE', 'test-123');
        break;

      case 'profile_added':
        result = await email.profileAdded(
          to,
          'Test Organization',
          'CDE',
          'https://tcredex.com/claim/test123',
          'Test Contact'
        );
        break;

      case 'allocation':
        result = await email.allocationAnnouncement(
          to,
          'Test CDE',
          55000000,
          2024,
          'Test Contact'
        );
        break;

      default:
        // Default: send confirm email
        result = await email.confirmEmail(
          to,
          'Test User',
          'https://tcredex.com/confirm?token=test123'
        );
    }

    return NextResponse.json({
      success: result.success,
      emailId: result.id,
      error: result.error,
      template: template || 'confirm',
      sentTo: to,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test email' },
      { status: 500 }
    );
  }
}
