# Vercel Deployment Guide for tCredex Frontend

## Overview

This guide provides comprehensive instructions for deploying the tCredex frontend to Vercel successfully, addressing common 500 errors and configuration issues.

## Prerequisites

- Vercel account with access to the project
- Supabase project with configured database
- Supabase auth (no Clerk)
- All required API keys (Mapbox, SAM.gov, Resend, OpenAI, etc.)

## Required Environment Variables

### Critical Environment Variables (Required for Deployment)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://tcredex.com
VERCEL_URL=auto-filled-by-vercel

# API Configuration (if using separate backend)
# In development: http://127.0.0.1:8080 (or your backend port)
# In production: https://api.tcredex.com
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
```

### Optional Environment Variables

```bash
# External Services
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your-google-places-key
SAM_GOV_API_KEY=your-sam-gov-key
RESEND_API_KEY=your-resend-key
OPENAI_API_KEY=your-openai-key

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Ledger/Cron Configuration
CRON_SECRET=your-cron-secret
LEDGER_GITHUB_TOKEN=your-github-token
LEDGER_GITHUB_GIST_ID=your-gist-id
LEDGER_ESCROW_EMAIL=ledger@tcredex.com

# SMTP Configuration (for ledger emails)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your-resend-api-key
```

### Development-Only Variables

For development and testing environments, you may need additional demo account configurations. These should be stored in a separate `.env.local` file and never committed to version control or used in production.

```bash

## Vercel Configuration

### Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install --legacy-peer-deps",
  "devCommand": "npm run dev"
}
```

### Function Configuration

Add to `vercel.json` (if not already present):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/ledger/anchor",
      "schedule": "0 * * * *"
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Common 500 Error Causes and Solutions

### 1. Missing Environment Variables

**Symptom**: 500 errors on API routes that use external services

**Solution**: 
- Verify all required environment variables are set in Vercel project settings
- Check that variable names match exactly (case-sensitive)
- Ensure `NEXT_PUBLIC_` prefix for client-side variables

### 2. Supabase Service Role Key Issues

**Symptom**: 500 errors on routes that require admin access to Supabase

**Solution**:
```bash
# Verify these are set correctly in Vercel
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Build-Time Data Fetching Errors

**Symptom**: `ECONNREFUSED` errors during build, affecting `/cde` and `/investor` pages

**Solution**: These are expected during static generation and don't affect runtime. Pages will fetch data client-side.

### 4. React Peer Dependency Conflicts

**Symptom**: Build fails with peer dependency errors

**Solution**: Use `--legacy-peer-deps` flag in install command (already configured in `package.json`)

### 5. Serverless Function Size Limits

**Symptom**: Functions fail to deploy or timeout

**Solution**: 
- Optimize imports to reduce bundle size
- Use dynamic imports for heavy dependencies
- Increase `maxDuration` in `vercel.json` if needed

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured in Vercel
- [ ] Supabase tables and RLS policies are set up
- [ ] Clerk application configured with correct redirect URLs
- [ ] Build completes successfully locally (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] No security vulnerabilities (`npm audit`)

### Deployment

- [ ] Push code to GitHub
- [ ] Vercel automatically triggers build
- [ ] Monitor build logs for errors
- [ ] Check function deployment status

### Post-Deployment

- [ ] Test authentication flow (sign in/sign up)
- [ ] Verify API routes work correctly
- [ ] Test critical user flows (deal creation, marketplace, etc.)
- [ ] Check browser console for client-side errors
- [ ] Monitor Vercel function logs for 500 errors

## Debugging 500 Errors in Production

### View Logs

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on specific function to see invocation logs
3. Look for error stack traces and messages

### Common Log Patterns

```
Error: Cannot find module 'xyz'
→ Missing dependency or build issue

Error: fetch failed ECONNREFUSED
→ External API not reachable (check env vars)

Error: Invalid token
→ Clerk/Supabase authentication issue

Error: relation "table_name" does not exist  
→ Database table missing or Supabase connection issue
```

### Testing API Routes Locally

```bash
# Start development server
npm run dev

# Test API endpoint
curl http://localhost:3000/api/auth/me \
  -H "Cookie: __clerk_db_jwt=your-token"
```

## Performance Optimization

### 1. Enable Edge Runtime for Specific Routes

For routes that don't need Node.js runtime:

```typescript
// app/api/simple-route/route.ts
export const runtime = 'edge';
```

### 2. Configure Caching

Add appropriate cache headers in API routes:

```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
  }
});
```

### 3. Optimize Bundle Size

- Already configured in `next.config.js` with code splitting
- Mapbox and Supabase are optimized via `optimizePackageImports`
- Vendor chunks are split for better caching

## Monitoring and Alerts

### Set Up Vercel Monitoring

1. Enable Web Analytics in Vercel dashboard
2. Set up Slack/Email notifications for deployment failures
3. Configure custom alerts for function errors

### Key Metrics to Monitor

- Function execution time (should be <3s)
- Error rate on API routes
- Build duration
- Client-side page load times

## Rollback Procedure

If deployment causes issues:

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Investigate issues in staging before redeploying

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Clerk Docs**: https://clerk.com/docs

## Troubleshooting Matrix

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| 500 on `/api/auth/me` | Missing Clerk keys | Set `CLERK_SECRET_KEY` |
| 500 on any `/api/deals/*` | Missing Supabase key | Set `SUPABASE_SERVICE_ROLE_KEY` |
| Build fails | Dependency conflict | Use `--legacy-peer-deps` |
| Timeout errors | Function too slow | Increase `maxDuration` or optimize code |
| CORS errors | Wrong origin | Update Clerk/Supabase allowed origins |
| 404 on routes | Middleware blocking | Check `middleware.ts` public routes |

## Contact

For deployment issues:
- Check GitHub Issues for known problems
- Contact your DevOps/Engineering team
- For Vercel-specific issues, use Vercel support chat or documentation

---

**Last Updated**: 2026-01-15
**Version**: 1.0
**Maintainer**: tCredex Engineering Team
