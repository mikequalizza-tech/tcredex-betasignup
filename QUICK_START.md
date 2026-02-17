# Quick Start Guide - tCredex Frontend

Get the tCredex frontend up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Git
- A code editor (VS Code recommended)

## 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/mikequalizza-tech/tcredex-frontend.git
cd tcredex-frontend

# Install dependencies
pnpm install
```

## 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your values
# REQUIRED: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Minimum Required Configuration:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
```

Get Supabase credentials from: https://supabase.com/dashboard

## 3. Start Development Server

```bash
pnpm dev
```

Frontend will be available at: http://localhost:3000

## 4. (Optional) Start Backend API

The frontend connects to a backend API on port 8080.

```bash
# In a separate terminal, navigate to tcredex-backend
cd ../tcredex-backend

# Start the backend (example - adjust based on actual backend)
go run main.go
# or
python -m uvicorn main:app --host 127.0.0.1 --port 8080
```

## 5. Test the Application

### Without Backend
- Home page: http://localhost:3000
- Sign up: http://localhost:3000/signup
- Sign in: http://localhost:3000/signin

### With Backend
- Dashboard: http://localhost:3000/dashboard
- Deals: http://localhost:3000/deals
- Automatch: http://localhost:3000/dashboard/automatch

## Common Commands

```bash
# Development
pnpm dev              # Start dev server

# Building
pnpm build            # Production build
pnpm start            # Start production server

# Linting
pnpm lint             # Run ESLint

# Cleaning
pnpm clean            # Clear cache
```

## Project Structure

```
tcredex-frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (signin, signup)
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── ...
├── components/            # React components
├── lib/                   # Utilities and libraries
│   ├── api/              # Backend API client
│   ├── config/           # Configuration
│   ├── supabase/         # Supabase client
│   └── ...
├── public/               # Static assets
├── docs/                 # Documentation
├── .env.local           # Environment variables (not in git)
└── next.config.js       # Next.js configuration
```

## Testing User Registration

1. Go to: http://localhost:3000/signup
2. Fill in the form:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Organization: `Test Company`
   - Role: Select "Project Sponsor"
3. Click "Create Account"
4. Check for success/redirect

## Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf .next node_modules
pnpm install
pnpm build
```

### Backend Connection Issues
- Ensure backend is running on port 8080
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Test backend: `curl http://127.0.0.1:8080/health`

### Environment Variable Errors
- Ensure `.env.local` exists and has required variables
- Restart dev server after changing `.env.local`
- Check for typos in variable names

## Next Steps

Once the app is running:

1. **Read Documentation**
   - [Environment Setup Guide](./docs/ENVIRONMENT_SETUP.md)
   - [Backend Integration Guide](./docs/BACKEND_INTEGRATION.md)
   - [Authentication Testing Guide](./docs/AUTHENTICATION_TESTING.md)

2. **Test Core Features**
   - User registration and login
   - Dashboard access
   - Deal browsing
   - Automatch functionality (requires backend)

3. **Review Code**
   - Check `lib/api/client.ts` for backend integration
   - Review `app/api/auth/` for authentication endpoints
   - Explore `components/` for UI components

## Getting Help

- **Documentation**: See `docs/` directory
- **Issues**: Check existing issues or create new one
- **Quick Reference**: See `INTEGRATION_FIX_SUMMARY.md`

## Production Deployment

For production deployment on Vercel:

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for details.

---

**You're all set!** The frontend should now be running at http://localhost:3000

For detailed setup and testing instructions, see the documentation in the `docs/` directory.
