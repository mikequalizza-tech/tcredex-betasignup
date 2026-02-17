import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, type RateLimitType } from '@/lib/rate-limit/redis';

// ============================================================================
// Public API Prefixes - Don't require auth (MINIMAL - only truly public endpoints)
// ============================================================================
const PUBLIC_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/support',
  '/blog',
  '/help',
  '/programs',
  '/r/',
  // Public API endpoints ONLY - no sensitive data
  '/api/auth',
  '/api/register',
  '/api/contact',
  '/api/chat',
  '/api/eligibility',
  '/api/geo',
  '/api/tracts',
  '/api/map',
  '/api/tiles',
  '/api/pricing',
  '/api/founders',
  '/api/webhook',
  '/api/onboarding',
  '/api/deals/marketplace', // Public marketplace for homepage featured deals
  '/api/blog', // Public blog content
  '/api/help', // Public help content
  // NOTE: /api/deals (protected), /api/cdes, /api/investors are NOT public - require auth!
];

// ============================================================================
// QR/Referral Campaign Destinations
// ============================================================================
const CAMPAIGN_DESTINATIONS: Record<string, string> = {
  'conf-2025': '/founders?utm_source=conference&utm_campaign=2025',
  'nmtc-conf': '/founders?utm_source=nmtc-conference',
  'htc-conf': '/founders?utm_source=htc-conference',
  'pitch-deck': '/founders?utm_source=pitch-deck',
  'business-card': '/founders?utm_source=business-card',
  'one-pager': '/founders?utm_source=one-pager',
  'brochure': '/founders?utm_source=brochure',
  'linkedin': '/founders?utm_source=linkedin',
  'twitter': '/founders?utm_source=twitter',
  'email-sig': '/founders?utm_source=email-signature',
  'cde-partner': '/founders?utm_source=cde-partner',
  'investor-intro': '/founders?utm_source=investor-intro',
  'demo': '/signin?redirect=/map',
  'test': '/founders?utm_source=test',
};

// ============================================================================
// Public Routes - These don't require authentication
// ============================================================================
const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/signup/success',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/about',
  '/pricing',
  '/contact',
  '/contact-aiv',
  '/features',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/founders',
  '/who-we-serve',
  '/onboarding',
  '/faq',
  '/newsletter',
  // NOTE: /map, /deals, /automatch are PROTECTED - require login!
];

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) return true;

  // Check prefix matches (only explicitly listed public prefixes)
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true;

  // Check pattern matches - ONLY truly public patterns
  if (pathname.startsWith('/programs')) return true;
  if (pathname.startsWith('/r/')) return true;

  // NOTE: /deals/ and /api/ are NOT blanket public!
  // Individual API routes must be explicitly listed in PUBLIC_PREFIXES
  // /deals, /map, /automatch require authentication

  return false;
}

// ============================================================================
// Middleware
// ============================================================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting
  let rateLimitType: RateLimitType = 'general';

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/register')) {
      rateLimitType = 'auth';
    } else {
      rateLimitType = 'api';
    }
  }

  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const allowed = await checkRateLimit(ip, rateLimitType);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }

  // Handle QR/Referral redirects
  if (pathname.startsWith('/r/')) {
    const code = pathname.replace('/r/', '').split('/')[0];
    if (code) {
      const codeUpper = code.toUpperCase();
      const codeLower = code.toLowerCase();

      let destination: string;
      if (codeUpper.startsWith('FM-')) {
        destination = `/founders?ref=${codeUpper}`;
      } else if (CAMPAIGN_DESTINATIONS[codeLower]) {
        destination = CAMPAIGN_DESTINATIONS[codeLower];
      } else {
        destination = `/founders?utm_source=qr&utm_campaign=${code}`;
      }

      const redirectUrl = new URL(destination, request.url);
      const response = NextResponse.redirect(redirectUrl);

      response.cookies.set('tcredex_track', JSON.stringify({
        code: codeUpper,
        type: codeUpper.startsWith('FM-') ? 'referral' : 'campaign',
        timestamp: Date.now(),
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });

      return response;
    }
  }

  // Public routes - allow through without auth check
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check Supabase auth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars missing, allow through (will fail on client)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Middleware] Supabase env vars not configured');
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated - redirect to signin
  if (!user) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Check onboarding for certain protected routes
  const needsOnboarding = ['/dashboard', '/deals/new', '/intake', '/closing-room', '/messages'];

  if (needsOnboarding.some(route => pathname.startsWith(route))) {
    const onboardingCookie = request.cookies.get('tcredex_onboarded')?.value;

    if (!onboardingCookie) {
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id, role_type')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id || !profile?.role_type) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }

      // Set cookie so we skip this DB check on subsequent navigations
      response.cookies.set('tcredex_onboarded', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours — re-validates daily
        path: '/',
      });
    }
  }

  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    // Exclude static files, Next.js internals, and upload routes (upload routes handle their own auth
    // and must not have their request body buffered/truncated by middleware)
    '/((?!_next/static|_next/image|favicon.ico|api/upload/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|woff2?|ttf|otf)$).*)',
  ],
};
