-- 06_vehicle_ownership_and_approval.sql
--
-- Fixes the schema drift that made driver vehicle data impossible to persist:
-- the app has been writing these columns for a long time, but they were never
-- added to the live table, so every save silently fell back to a reduced column
-- set (or failed outright).
--
-- Also introduces owner-scoped access + admin approval so a driver who signs in
-- with Google/LINE can manage their own vehicle, but nothing reaches the public
-- catalogue until an administrator approves it.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run (all idempotent).

-- ---------------------------------------------------------------------------
-- 1. Columns the application already writes but the table never had
-- ---------------------------------------------------------------------------
alter table public.vehicles
  add column if not exists plate_type text check (plate_type in ('yellow', 'blue')) default 'yellow',
  add column if not exists plate_number text,
  add column if not exists can_issue_tax_invoice boolean default false,
  add column if not exists business_type text check (business_type in ('company', 'individual')) default 'individual',
  add column if not exists is_available boolean default true,
  add column if not exists rental_type text check (rental_type in ('with_driver', 'self_drive')),
  add column if not exists transmission text check (transmission in ('auto', 'manual')),
  add column if not exists busy_dates text[] default array[]::text[];

-- ---------------------------------------------------------------------------
-- 2. Ownership + approval workflow
--    owner_id      : auth user id of the driver who owns this vehicle (null = seeded/admin-created)
--    approval_status: pending until an administrator approves it
-- ---------------------------------------------------------------------------
alter table public.vehicles
  add column if not exists owner_id text,
  add column if not exists approval_status text
    check (approval_status in ('pending', 'approved', 'rejected')) default 'approved',
  add column if not exists submitted_at timestamptz default now(),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

-- Backfill: rows that predate this migration were created by an administrator
-- through the console, so they are already approved and have no owner.
update public.vehicles
set approval_status = 'approved'
where approval_status is null;

alter table public.vehicles
  alter column approval_status set default 'approved',
  alter column approval_status set not null;

-- Indexes for the two hot paths: public catalogue reads, and owner lookups.
create index if not exists idx_vehicles_approval_status on public.vehicles(approval_status);
create index if not exists idx_vehicles_owner_id on public.vehicles(owner_id);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
--    Public traffic (anon key) may only ever read APPROVED vehicles.
--    Everything else stays behind service_role, which the Next.js server uses.
-- ---------------------------------------------------------------------------
alter table public.vehicles enable row level security;

drop policy if exists "Allow public select on vehicles" on public.vehicles;
create policy "Allow public select on vehicles"
  on public.vehicles for select
  to anon, authenticated
  using (approval_status = 'approved');

drop policy if exists "Restrict insert vehicles to service_role" on public.vehicles;
drop policy if exists "Restrict update vehicles to service_role" on public.vehicles;
drop policy if exists "Restrict delete vehicles to service_role" on public.vehicles;
