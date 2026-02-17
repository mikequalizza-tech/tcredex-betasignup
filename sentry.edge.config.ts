import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower sample rate for edge (middleware runs on every request)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  environment: process.env.NODE_ENV,
});
