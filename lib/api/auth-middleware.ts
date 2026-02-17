/**
 * Authentication Middleware
 * Provides utilities for validating authentication and authorization on API routes
 *
 * CRITICAL: This is the single source of truth for auth validation
 * All API endpoints MUST use requireAuth() before accessing data
 *
 * Uses Supabase for authentication and user/organization data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Authenticated user context
 * This is what every API endpoint receives after requireAuth()
 */
export interface AuthUser {
  id: string;
  email: string;
  organizationId: string;
  organizationType: 'sponsor' | 'cde' | 'investor' | 'admin';
  userRole: 'ORG_ADMIN' | 'PROJECT_ADMIN' | 'MEMBER' | 'VIEWER';
}

/**
 * Validate authentication and return user context
 * CRITICAL: Call this at the start of every API endpoint
 * Throws AuthError if not authenticated or user not found
 */
export async function requireAuth(_request: NextRequest): Promise<AuthUser> {
  try {
    // Get Supabase auth session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthError('UNAUTHENTICATED', 'Not authenticated', 401);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user record from database using Supabase Auth ID
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, organization_id, role_type, organization_name')
      .eq('id', user.id)
      .single();

    if (userError || !userRecord) {
      // User not found in database - they need to complete registration
      throw new AuthError(
        'USER_NOT_FOUND',
        'User not found in database. Please complete registration.',
        401
      );
    }

    const typedUserRecord = userRecord as {
      id: string;
      email: string;
      role: string;
      organization_id: string;
      role_type: string | null;
      organization_name: string | null;
    };

    // Get organization type from role_type column
    const organizationType = typedUserRecord.role_type;

    // Validate organization type is valid
    const validOrgTypes = ['sponsor', 'cde', 'investor', 'admin'];
    if (!organizationType || !validOrgTypes.includes(organizationType)) {
      throw new AuthError('INVALID_ORG_TYPE', 'User has invalid organization type', 403);
    }

    // Validate user role is valid
    const validUserRoles = ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'];
    if (!validUserRoles.includes(typedUserRecord.role)) {
      throw new AuthError('INVALID_USER_ROLE', 'User has invalid role', 403);
    }

    return {
      id: typedUserRecord.id,
      email: typedUserRecord.email,
      organizationId: typedUserRecord.organization_id,
      organizationType: organizationType as 'sponsor' | 'cde' | 'investor' | 'admin',
      userRole: typedUserRecord.role as 'ORG_ADMIN' | 'PROJECT_ADMIN' | 'MEMBER' | 'VIEWER',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error('[Auth] Unexpected error:', error);
    throw new AuthError('AUTH_ERROR', 'Authentication failed', 500);
  }
}

/**
 * Optional auth - returns user if authenticated, null otherwise
 * Use for endpoints that work for both authenticated and anonymous users
 */
export async function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}

/**
 * Require user to be organization admin
 * Use for endpoints that modify org data
 */
export async function requireOrgAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (user.userRole !== 'ORG_ADMIN') {
    throw new AuthError('FORBIDDEN', 'Only organization admins can perform this action', 403);
  }

  return user;
}

/**
 * Require user to be system admin
 * Use for system-wide operations
 */
export async function requireSystemAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (user.organizationType !== 'admin') {
    throw new AuthError('FORBIDDEN', 'Only system admins can perform this action', 403);
  }

  return user;
}

/**
 * Verify user belongs to organization
 * Use to validate org access before returning org data
 */
export function verifyOrgAccess(user: AuthUser, targetOrgId: string): void {
  if (user.organizationId !== targetOrgId && user.organizationType !== 'admin') {
    throw new AuthError('FORBIDDEN', 'You do not have access to this organization', 403);
  }
}

/**
 * Verify user can access deal
 * Checks if user's org is sponsor, assigned CDE, or investor with commitment
 */
export async function verifyDealAccess(
  request: NextRequest,
  user: AuthUser,
  dealId: string,
  requiredAccess: 'view' | 'edit' = 'view'
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Get deal WITHOUT FK join (avoids Supabase FK relationship issues)
  const { data: deal, error } = await supabase
    .from('deals')
    .select('sponsor_id, assigned_cde_id, investor_id, status')
    .eq('id', dealId)
    .single();

  if (error) {
    console.error('[Auth] Deal query error:', error);
    throw new AuthError('NOT_FOUND', 'Deal not found', 404);
  }

  if (!deal) {
    throw new AuthError('NOT_FOUND', 'Deal not found', 404);
  }

  const typedDeal = deal as {
    sponsor_id: string;
    assigned_cde_id: string | null;
    investor_id: string | null;
    status: string;
  };

  // System admin can access everything
  if (user.organizationType === 'admin') {
    return;
  }

  // Sponsor can access their own deals - query sponsors table separately
  if (user.organizationType === 'sponsor' && typedDeal.sponsor_id) {
    const { data: sponsor } = await supabase
      .from('sponsors')
      .select('organization_id')
      .eq('id', typedDeal.sponsor_id)
      .single();

    if (sponsor && (sponsor as { organization_id: string }).organization_id === user.organizationId) {
      return;
    }
  }

  // CDE can access assigned deals.
  // Try canonical cdes first (matches deals.assigned_cde_id FK), then cdes_merged fallback.
  if (user.organizationType === 'cde' && typedDeal.assigned_cde_id) {
    const { data: cdePrimary } = await supabase
      .from('cdes')
      .select('organization_id')
      .eq('id', typedDeal.assigned_cde_id)
      .single();

    if (cdePrimary && (cdePrimary as { organization_id: string }).organization_id === user.organizationId) {
      return;
    }

    const { data: cdeFallback } = await supabase
      .from('cdes_merged')
      .select('organization_id')
      .eq('id', typedDeal.assigned_cde_id)
      .single();

    if (cdeFallback && (cdeFallback as { organization_id: string }).organization_id === user.organizationId) {
      return;
    }
  }

  // CDE/Investor can access deals they've been invited to via outreach (match_requests)
  if (user.organizationType === 'cde' || user.organizationType === 'investor') {
    const { data: matchRequest } = await supabase
      .from('match_requests')
      .select('id')
      .eq('deal_id', dealId)
      .eq('target_id', user.organizationId)
      .eq('target_type', user.organizationType === 'cde' ? 'cde' : 'investor')
      .in('status', ['pending', 'accepted'])
      .limit(1)
      .maybeSingle();

    if (matchRequest) {
      return;
    }
  }

  // Investors can access deals directly assigned to them or deals they have commitments on.
  if (user.organizationType === 'investor') {
    const { data: investor } = await supabase
      .from('investors')
      .select('id')
      .eq('organization_id', user.organizationId)
      .single();

    const investorId = (investor as { id: string } | null)?.id;
    if (investorId) {
      if (typedDeal.investor_id === investorId) {
        return;
      }

      const { data: existingCommitment } = await supabase
        .from('commitments')
        .select('id')
        .eq('deal_id', dealId)
        .eq('investor_id', investorId)
        .limit(1)
        .maybeSingle();

      if (existingCommitment) {
        return;
      }
    }
  }

  // For view access, allow CDEs and investors to see public deals.
  if (requiredAccess === 'view' && ['available', 'seeking_capital', 'matched'].includes(typedDeal.status)) {
    return;
  }

  throw new AuthError('FORBIDDEN', 'You do not have access to this deal', 403);
}

/**
 * Handle auth errors and return appropriate response
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  console.error('[Auth] Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Wrap API route handler with auth error handling
 */
export function withAuthErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

// Legacy function for backwards compatibility
export function getTokenFromRequest(_request: NextRequest): string | null {
  // With Supabase, we don't need to extract tokens manually
  // Supabase middleware handles this automatically via cookies
  return null;
}
