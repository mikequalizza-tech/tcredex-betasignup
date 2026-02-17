-- =============================================================================
-- TCREDEX SUPABASE SCHEMA + RLS
-- Phase-Based Visibility Model (ChatGPT + Young Bull alignment)
-- Generated: December 24, 2024
-- =============================================================================
--
-- ASSUMPTIONS:
-- - Using Supabase Auth
-- - auth.uid() → user id
-- - auth.jwt() ->> 'org_id' → organization id
-- - auth.jwt() ->> 'role' → 'sponsor' | 'cde' | 'investor' | 'admin'
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1️⃣ CORE SCHEMA (FOUNDATION)
-- -----------------------------------------------------------------------------

-- organizations (reference)
create table organizations (
  id uuid primary key,
  name text not null,
  org_type text not null check (org_type in ('sponsor','cde','investor')),
  created_at timestamptz default now()
);

-- projects (authoritative lifecycle + visibility)
create table projects (
  id uuid primary key default gen_random_uuid(),
  sponsor_org_id uuid not null references organizations(id),
  phase text not null check (phase in ('investor','cde','closed')),
  visibility_level text not null check (visibility_level in ('private','market','invited')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Interpretation:
-- phase = what the project needs next
-- visibility_level = who can discover it at all

-- projects_public (safe for market)
create table projects_public (
  project_id uuid primary key references projects(id) on delete cascade,
  name text,
  city text,
  state text,
  census_geoid text,
  summary text
);

-- projects_private (never leaked)
create table projects_private (
  project_id uuid primary key references projects(id) on delete cascade,
  budget numeric,
  sponsor_notes text,
  internal_documents jsonb
);

-- project_memberships (relationship spine)
create table project_memberships (
  project_id uuid references projects(id) on delete cascade,
  org_id uuid references organizations(id),
  role text not null check (role in ('sponsor','cde','investor')),
  created_at timestamptz default now(),
  primary key (project_id, org_id, role)
);

-- project_invites (explicit visibility)
create table project_invites (
  project_id uuid references projects(id) on delete cascade,
  org_id uuid references organizations(id),
  invited_by uuid,
  created_at timestamptz default now(),
  primary key (project_id, org_id)
);

-- -----------------------------------------------------------------------------
-- 2️⃣ SERVER-SIDE RESOLVER (NO UI LOGIC)
-- -----------------------------------------------------------------------------
-- This is the single source of truth for "what does this project need?"

create view project_requirements as
select
  p.id as project_id,
  p.sponsor_org_id,
  p.phase,
  (p.phase in ('investor','cde')) as needs_investor,
  (p.phase = 'cde') as needs_cde,
  p.visibility_level
from projects p;

-- Everything else depends on this view.

-- -----------------------------------------------------------------------------
-- 3️⃣ RLS — TURN IT ON
-- -----------------------------------------------------------------------------

alter table projects enable row level security;
alter table projects_public enable row level security;
alter table projects_private enable row level security;
alter table project_memberships enable row level security;
alter table project_invites enable row level security;

-- -----------------------------------------------------------------------------
-- 4️⃣ RLS POLICIES (THE HEART)
-- -----------------------------------------------------------------------------

-- A. Sponsor project isolation (HARD RULE)
-- Sponsors cannot see other projects exist.
create policy sponsor_own_projects
on projects
for select
using (
  sponsor_org_id = (auth.jwt() ->> 'org_id')::uuid
);

-- B. Sponsor access to public vs private data
create policy sponsor_public_access
on projects_public
for select
using (
  exists (
    select 1 from projects p
    where p.id = projects_public.project_id
      and p.sponsor_org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

create policy sponsor_private_access
on projects_private
for select
using (
  exists (
    select 1 from projects p
    where p.id = projects_private.project_id
      and p.sponsor_org_id = (auth.jwt() ->> 'org_id')::uuid
  )
);

-- C. Sponsor counterparty visibility (PHASE-GATED)
-- Sponsors never query organizations directly.
-- They query through project context.

create view sponsor_visible_counterparties as
select
  o.id,
  o.name,
  o.org_type,
  pr.project_id,
  pr.sponsor_org_id
from project_requirements pr
join organizations o
  on (
    (pr.needs_investor and o.org_type = 'investor')
    or
    (pr.needs_cde and o.org_type = 'cde')
  );

-- Note: RLS on views requires the view to be security_invoker or use function
-- For now, filter in application layer using sponsor_org_id check

-- D. CDE project visibility
create policy cde_view_projects
on projects
for select
using (
  (auth.jwt() ->> 'role') = 'cde'
  and phase = 'cde'
  and visibility_level in ('market','invited')
);

-- E. Investor project visibility
create policy investor_view_projects
on projects
for select
using (
  (auth.jwt() ->> 'role') = 'investor'
  and phase in ('investor','cde')
  and visibility_level in ('market','invited')
);

-- -----------------------------------------------------------------------------
-- 5️⃣ PHASE ADVANCEMENT GOVERNANCE (SEQUENTIAL, ENFORCED)
-- -----------------------------------------------------------------------------

-- Sponsor: investor → cde only
create policy sponsor_advance_to_cde
on projects
for update
using (
  sponsor_org_id = (auth.jwt() ->> 'org_id')::uuid
  and phase = 'investor'
)
with check (
  phase = 'cde'
);

-- Admin: cde → closed
create policy admin_close_project
on projects
for update
using (
  (auth.jwt() ->> 'role') = 'admin'
  and phase = 'cde'
)
with check (
  phase = 'closed'
);

-- -----------------------------------------------------------------------------
-- 6️⃣ AUDIT LOG (COMPLIANCE-GRADE)
-- -----------------------------------------------------------------------------

create table audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  org_id uuid,
  role text,
  project_id uuid,
  action text,
  accessed_at timestamptz default now()
);

-- Helper function to log access
create function log_project_access(
  p_project_id uuid,
  p_action text
) returns void as $$
begin
  insert into audit_log (
    user_id,
    org_id,
    role,
    project_id,
    action
  ) values (
    auth.uid(),
    (auth.jwt() ->> 'org_id')::uuid,
    auth.jwt() ->> 'role',
    p_project_id,
    p_action
  );
end;
$$ language plpgsql security definer;

-- Call this from:
-- - API routes
-- - RPC functions
-- - Sensitive selects / exports

-- -----------------------------------------------------------------------------
-- WHY THIS WORKS (SUMMARY)
-- -----------------------------------------------------------------------------
--
-- Phase controls relevance
-- Visibility controls discovery
-- RLS enforces reality
-- UI becomes honest, not fragile
-- Audit trail protects you
--
-- =============================================================================
