# Integration Test Guide

This guide explains how to test the frontend-backend integration after the fixes.

## Prerequisites

1. Backend running on port 8080
2. Frontend `.env.local` configured correctly
3. Supabase project accessible

## Test Scenarios

### 1. Health Check Test

**Verify backend is accessible:**
```bash
curl http://127.0.0.1:8080/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "tcredex-backend",
  "version": "1.0.0",
  "timestamp": "2026-01-23T..."
}
```

### 2. Build Test

**Build the frontend:**
```bash
cd /path/to/tcredex-frontend
pnpm build
```

**Expected Result:**
- ✅ Build completes successfully
- No webpack errors
- May show warnings about backend connection (expected if backend not running)

### 3. Development Server Test

**Start the dev server:**
```bash
pnpm dev
```

**Expected Result:**
- ✅ Server starts on http://localhost:3000
- No compilation errors
- Ready for connections

### 4. Registration Flow Test

**Manual Test:**
1. Navigate to http://localhost:3000/signup
2. Fill in registration form:
   - Email: test@example.com
   - Password: TestPassword123!
   - Name: Test User
   - Organization: Test Org
   - Role: sponsor/cde/investor
3. Submit form
4. Check console network tab for API call to backend

**Expected Result:**
- POST request to http://127.0.0.1:8080/api/auth/register
- 200 OK response
- User redirected to dashboard or onboarding

**Common Errors:**
- `ECONNREFUSED` → Backend not running on port 8080
- `404 Not Found` → Backend API route not implemented
- `CORS error` → Backend not allowing frontend origin

### 5. Login Flow Test

**Manual Test:**
1. Navigate to http://localhost:3000/signin
2. Enter credentials from registration
3. Submit form

**Expected Result:**
- Supabase authentication succeeds
- User redirected to role-specific dashboard
- Session cookie set

### 6. Onboarding Flow Test

**Manual Test:**
1. Sign up as new user
2. Complete onboarding steps
3. Verify profile information saved

**Expected Result:**
- Onboarding form displays
- Data submitted to backend
- User profile created in database

## Troubleshooting

### Backend Connection Failed

**Error:** `TypeError: fetch failed - connect ECONNREFUSED 127.0.0.1:8080`

**Solutions:**
1. Verify backend is running: `curl http://127.0.0.1:8080/api/health`
2. Check backend port matches `.env.local` setting
3. Check backend logs for startup errors

### CORS Errors

**Error:** `Access-Control-Allow-Origin header is missing`

**Solutions:**
1. Verify backend CORS configuration allows `http://localhost:3000`
2. Check backend middleware setup
3. Ensure backend is using proper CORS headers

### Authentication Errors

**Error:** `Invalid credentials` or `User not found`

**Solutions:**
1. Verify Supabase credentials in both frontend and backend `.env` files
2. Check Supabase project is active
3. Verify database tables exist and have proper structure

### Environment Variable Issues

**Error:** `process.env.NEXT_PUBLIC_API_URL is undefined`

**Solutions:**
1. Verify `.env.local` exists in project root
2. Restart dev server after changing `.env.local`
3. Check variable names match exactly (case-sensitive)

## Automated Test Command

If you have test scripts configured:
```bash
pnpm test
```

## Success Criteria

All of the following should work:
- [ ] Frontend builds without errors
- [ ] Dev server starts successfully
- [ ] Can access http://localhost:3000
- [ ] Registration form submits to backend
- [ ] Login form authenticates users
- [ ] Onboarding flow completes
- [ ] Dashboard loads for authenticated users

## Next Steps

After verifying integration:
1. Test additional features (deal creation, matching, etc.)
2. Run full test suite
3. Test in production-like environment
4. Deploy to staging/production

## Support

If issues persist:
1. Check `DEVELOPMENT.md` for detailed setup instructions
2. Review `FIX_SUMMARY.md` for known issues and solutions
3. Check backend repository for additional troubleshooting
4. Create an issue with detailed error logs
