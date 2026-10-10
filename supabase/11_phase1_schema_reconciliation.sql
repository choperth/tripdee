-- 11_phase1_schema_reconciliation.sql
-- Phase 1 schema/data-integrity reconciliation. Safe to re-run.

alter table public.quotations
  add column if not exists customer_id text,
  add column if not exists total_days integer;

alter table public.board_quotes
  add column if not exists driver_whatsapp text,
  add column if not exists is_accepted boolean not null default false;

alter table public.bookings
  add column if not exists completed_at timestamptz;

alter table public.driver_leads
  add column if not exists service_type text,
  add column if not exists deposit_terms text,
  add column if not exists amenities text,
  add column if not exists pickup_location text;

-- Normalize legacy/default values before enforcing checks.
update public.quotations set total_days = 1 where total_days is not null and total_days < 1;
update public.driver_leads set service_type = null
where service_type is not null and service_type not in ('with_driver', 'self_drive');

alter table public.quotations drop constraint if exists quotations_total_days_check;
alter table public.quotations add constraint quotations_total_days_check
  check (total_days is null or total_days >= 1);

alter table public.driver_leads drop constraint if exists driver_leads_service_type_check;
alter table public.driver_leads add constraint driver_leads_service_type_check
  check (service_type is null or service_type in ('with_driver', 'self_drive'));

create index if not exists idx_quotations_customer_id on public.quotations(customer_id);
create index if not exists idx_quotations_customer_created_at
  on public.quotations(customer_id, created_at desc);
create index if not exists idx_board_quotes_post_id on public.board_quotes(post_id);
create index if not exists idx_board_quotes_accepted
  on public.board_quotes(post_id, is_accepted) where is_accepted = true;
create index if not exists idx_bookings_completed_at on public.bookings(completed_at);

alter table public.board_posts enable row level security;
alter table public.board_quotes enable row level security;

-- Migration 10 reopened public mutation/read access. Keep public post browsing and
-- quote submission, but all sensitive quote reads and state changes go through
-- the server-side service-role API after token/PIN authorization.
drop policy if exists "Allow public update on board_posts" on public.board_posts;
drop policy if exists "Restrict update board_posts to service_role" on public.board_posts;
create policy "Restrict update board_posts to service_role"
  on public.board_posts for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Allow public select on board_quotes" on public.board_quotes;
drop policy if exists "Restrict read board_quotes to service_role" on public.board_quotes;
create policy "Restrict read board_quotes to service_role"
  on public.board_quotes for select
  using (auth.role() = 'service_role');

drop policy if exists "Allow public update on board_quotes" on public.board_quotes;
drop policy if exists "Restrict update board_quotes to service_role" on public.board_quotes;
create policy "Restrict update board_quotes to service_role"
  on public.board_quotes for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
