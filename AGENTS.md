# AGENTS.md

## Project overview
- Next.js 15 (App Router) frontend for the tCredex platform.
- Integrates with the tcredex-backend API (default: http://127.0.0.1:8080).
- Uses Supabase Auth and PostgreSQL (via Supabase).

## Local setup
1. Install dependencies:
   - Node.js 18+
   - pnpm 8+
2. Install packages:
   - `pnpm install`
3. Configure environment:
   - `cp .env.example .env.local`
   - Ensure `NEXT_PUBLIC_API_URL=http://127.0.0.1:8080`
4. Run the app:
   - `pnpm dev`

## Common commands
- `pnpm dev` - start dev server
- `pnpm build` - production build
- `pnpm start` - run production server
- `pnpm lint` - lint checks
- `pnpm analyze` - bundle analysis build
- `pnpm clean` - clear `.next` and cache
- `pnpm security:scan` - npm audit (production deps)

## Tests
- No dedicated test script is defined in `package.json`.
- Use `pnpm lint` and manual verification.
- See `DEVELOPMENT.md` for suggested manual auth flow checks.

## Key directories
- `app/` - Next.js routes and layouts
- `components/` - UI components
- `lib/` - API clients, auth, helpers
- `content/` - MDX content
- `public/` - static assets
- `supabase/` - SQL migrations and schema files
- `scripts/` - data and migration scripts

## Environment variables
- Required:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Optional:
  - `NEXT_PUBLIC_MAPBOX_TOKEN`
  - `NEXT_PUBLIC_SITE_URL`
- When adding new env vars, update `.env.example` and `DEVELOPMENT.md`.

## Notes for changes
- `app/api/` contains frontend API routes that proxy to the backend.
- Auth relies on Supabase; avoid breaking cookie/session handling.
- Map features require Mapbox token (`NEXT_PUBLIC_MAPBOX_TOKEN`).
