# tCredex Development Guide

This guide explains how to set up and run the tCredex frontend in development mode, especially when integrating with the [tcredex-backend](https://github.com/mikequalizza-tech/tcredex-backend).

## Prerequisites

- **Node.js** 18+
- **pnpm** 8+ (install with `npm install -g pnpm`)
- **Backend API** running on port 8080 (see [tcredex-backend](https://github.com/mikequalizza-tech/tcredex-backend))

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure the following **required** variables:

```bash
# Backend API - MUST match your backend port (default: 8080)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080

# Supabase - Get from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Build the Project

```bash
pnpm build
```

### 4. Run Development Server

```bash
pnpm dev
```

The frontend will start on **http://localhost:3000** (or the next available port if 3000 is in use).

## Running Frontend + Backend Together

To run the full tCredex stack locally, you need both the frontend and backend running simultaneously:

### Option 1: Run in Separate Terminals

**Terminal 1 - Backend:**

```bash
cd /path/to/tcredex-backend
# Follow backend setup instructions
npm run dev  # or equivalent command for backend
```

**Terminal 2 - Frontend:**

```bash
cd /path/to/tcredex-frontend
pnpm dev
```

### Option 2: Use Process Manager (tmux/screen)

You can use `tmux` or `screen` to manage both processes in a single terminal session.

## Common Issues & Solutions

### Issue: AUTH and Onboarding Not Working

**Symptoms:**

- Sign up/Sign in forms return errors
- Users redirected incorrectly after login
- Onboarding flow doesn't complete

**Solutions:**

1. **Backend API URL mismatch:**
   - Ensure `NEXT_PUBLIC_API_URL` in `.env.local` matches your backend port
   - Default backend port is **8080** (NOT 3004)
   - Frontend `.env.local`: `NEXT_PUBLIC_API_URL=http://127.0.0.1:8080`

2. **Backend not running:**
   - Start the backend server before testing AUTH flows
   - Check backend is accessible: `curl http://127.0.0.1:8080/api/health`

3. **Supabase configuration:**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
   - Check Supabase project is active and accessible

4. **CORS issues:**
   - Ensure backend allows requests from `http://localhost:3000`
   - Check backend CORS configuration

### Issue: Build Fails with Duplicate Imports

**Solution:** This has been fixed in the latest version. If you still encounter this:

- Make sure you've pulled the latest changes
- Delete `node_modules` and `.next` directories
- Run `pnpm install` and `pnpm build` again

### Issue: pnpm Workspace Errors

**Solution:** The `pnpm-workspace.yaml` has been corrected. If issues persist:

- Ensure you're using pnpm 8+
- Delete `pnpm-lock.yaml` and run `pnpm install` again

## Project Structure

```
tcredex-frontend/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages (signin, signup, etc.)
│   ├── api/               # API routes (proxies to backend)
│   ├── dashboard/         # Protected dashboard routes
│   └── ...
├── components/            # React components
├── lib/                   # Utilities and helpers
│   ├── api/              # Backend API client
│   ├── auth/             # Auth utilities
│   └── supabase/         # Supabase client
├── .env.local            # Local environment variables (DO NOT COMMIT)
├── .env.example          # Example environment variables
├── package.json          # Dependencies and scripts
└── pnpm-workspace.yaml   # pnpm workspace configuration
```

## Authentication Flow

tCredex uses **Supabase Auth** for authentication. Here's how the flow works:

1. **Sign Up:**
   - User submits form → Frontend calls `/api/auth/register`
   - Backend creates Supabase auth user + organization record
   - Returns session token

2. **Sign In:**
   - User submits credentials → Frontend calls Supabase directly
   - Supabase returns session token
   - Frontend stores in cookies/local storage

3. **Onboarding:**
   - New users redirected to `/onboarding`
   - Complete profile information
   - Redirected to appropriate dashboard based on role

## Testing

### Run Tests

```bash
pnpm test
```

### Test Auth Flow Manually

1. Start backend on port 8080
2. Start frontend on port 3000
3. Navigate to http://localhost:3000/signup
4. Create a test account
5. Verify redirect to dashboard

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm clean` - Clean build cache

## Environment Variables Reference

| Variable                        | Required | Default                 | Description                       |
| ------------------------------- | -------- | ----------------------- | --------------------------------- |
| `NEXT_PUBLIC_API_URL`           | Yes      | `http://127.0.0.1:8080` | Backend API URL                   |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | -                       | Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | -                       | Supabase anon/public key          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | -                       | Supabase service role key (admin) |
| `NEXT_PUBLIC_SITE_URL`          | No       | `http://localhost:3000` | Frontend URL                      |
| `NEXT_PUBLIC_MAPBOX_TOKEN`      | No       | -                       | Mapbox API token (for maps)       |

## Debugging

### Enable Debug Logs

```bash
DEBUG=* pnpm dev
```

### Check Backend Connection

```bash
curl http://127.0.0.1:8080/api/health
```

### Verify Environment Variables

```bash
# In your browser console:
console.log(process.env.NEXT_PUBLIC_API_URL)
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with backend running
4. Submit a pull request

## Need Help?

- Backend repository: https://github.com/mikequalizza-tech/tcredex-backend
- Check existing issues
- Create a new issue with details about your setup
