# tCredex Frontend

The tCredex platform frontend - a Next.js application for managing New Markets Tax Credit (NMTC) deals, matching Community Development Entities (CDEs) with projects, and facilitating the deal closing process.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Backend API running (see [tcredex-backend](https://github.com/mikequalizza-tech/tcredex-backend))

### Installation

```bash
# Install pnpm globally if you haven't
npm install -g pnpm

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your configuration
# IMPORTANT: Set NEXT_PUBLIC_API_URL=http://127.0.0.1:8080

# Build the project
pnpm build

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📖 Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete development guide including:
  - Frontend + Backend integration setup
  - AUTH and Onboarding troubleshooting
  - Common issues and solutions
  - Testing procedures

## 🔑 Key Features

- **Authentication & Onboarding** - Supabase-based auth with role-specific onboarding
- **Deal Management** - Create, track, and manage NMTC deals
- **Auto-Matching** - AI-powered CDE matching based on deal characteristics
- **Closing Room** - Real-time collaboration workspace for deal closing
- **Document Management** - Upload, share, and manage deal documents
- **Interactive Maps** - Census tract visualization and eligibility checking

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, TailwindCSS 4
- **Auth:** Supabase Auth
- **Database:** Supabase (PostgreSQL with PostGIS)
- **Maps:** Mapbox GL JS
- **Real-time:** Socket.io, LiveKit
- **Deployment:** Vercel

## 🏗️ Project Structure

```
tcredex-frontend/
├── app/              # Next.js app directory (routes)
├── components/       # React components
├── lib/             # Utilities, API clients, helpers
├── public/          # Static assets
├── styles/          # Global styles
└── types/           # TypeScript type definitions
```

## ⚙️ Environment Variables

Required environment variables (see `.env.example` for full list):

```bash
# Backend API (CRITICAL - must match backend port)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🐛 Troubleshooting

### AUTH/Onboarding Not Working?

1. Ensure backend is running on port 8080
2. Verify `NEXT_PUBLIC_API_URL=http://127.0.0.1:8080` in `.env.local`
3. Check Supabase credentials are correct
4. See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed troubleshooting

### Build Failing?

```bash
# Clean and rebuild
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

## 📝 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm clean` - Clean build cache

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test with backend running
4. Submit a pull request

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## 🚢 Deployment

The application is optimized for deployment on Vercel. See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for details.

---

**Backend Repository:** [tcredex-backend](https://github.com/mikequalizza-tech/tcredex-backend)
