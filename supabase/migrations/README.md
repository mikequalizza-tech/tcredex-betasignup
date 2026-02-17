# tCredex Supabase Migrations

## Overview

This directory contains the complete database schema for tCredex v1.7.

## Files

### 001_complete_schema.sql
Complete database schema including:
- **Organizations** - Parent entity for all org types
- **Users** - User accounts with roles and org membership
- **CDEs** - Community Development Entity profiles
- **CDE Allocations** - Individual federal/state allocations
- **Sponsors** - Project sponsor profiles
- **Investors** - Tax credit investor profiles
- **Deals** - Project/deal records with full intake data
- **Letters of Intent** - LOI workflow with state machine
- **Commitments** - Investor commitment workflow
- **Closing Rooms** - Deal closing management
- **Documents** - File storage with versioning
- **Ledger Events** - Immutable audit trail
- **Team Members** - Org membership and roles
- **Project Assignments** - User-to-deal access
- **Notifications** - User notifications

Also includes:
- Enums for status types
- Indexes for common queries
- Triggers for updated_at timestamps
- Auto-generated LOI/Commitment numbers
- Row Level Security policies
- Helper functions for RLS
- Views for common queries

### 002_seed_data.sql
Test data for development including:
- 1 Admin organization
- 5 CDE organizations with profiles
- 5 Sponsor organizations
- 3 Investor organizations
- 11 CDE allocations (federal + state)
- 8 Sample deals at various stages
- Test users for each organization

## How to Run

### Option 1: Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste `001_complete_schema.sql`
3. Run the query
4. Copy and paste `002_seed_data.sql`
5. Run the query

### Option 2: Supabase CLI
```bash
# From project root
supabase db push

# Or run specific migrations
supabase db reset
```

### Option 3: Direct Connection
```bash
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f 001_complete_schema.sql
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f 002_seed_data.sql
```

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## API Routes Created

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/deals` | GET, POST | List/create deals |
| `/api/deals/[id]` | GET, PUT, DELETE | Single deal CRUD |
| `/api/deals/[id]/submit` | POST | Submit deal for review |
| `/api/cdes` | GET, POST | List/create CDEs |
| `/api/cdes/[id]` | GET, PUT, DELETE | Single CDE CRUD |
| `/api/cdes/[id]/allocations` | GET, POST | CDE allocations |
| `/api/users` | GET, POST | List/create users |
| `/api/users/[id]` | GET, PUT, DELETE | Single user CRUD |
| `/api/organizations` | GET, POST | List/create orgs |
| `/api/organization` | GET, PUT | Single org (by `id` query param) |

## Database Types

TypeScript types are defined in `/types/database.ts`:
- `DbOrganization`, `DbUser`, `DbCDE`, `DbCDEAllocation`
- `DbSponsor`, `DbInvestor`, `DbDeal`
- `DbLOI`, `DbCommitment`, `DbClosingRoom`
- `DbDocument`, `DbLedgerEvent`
- `DbTeamMember`, `DbProjectAssignment`, `DbNotification`

## Next Steps

1. Run migrations in Supabase
2. Verify tables created
3. Test API routes
4. Update frontend to use real API calls
5. Remove localStorage fallbacks

---

*Generated: tCredex v1.7 Schema*
