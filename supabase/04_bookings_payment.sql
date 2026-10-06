-- ==============================================================================
-- TripDee (ทริปดี) - 04 Bookings & ChillPay Payment Migration
-- ตาราง public.bookings สำหรับระบบจองมัดจำและ Dynamic PromptPay QR
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

create table if not exists public.bookings (
    id text primary key default ('TD-BK-' || upper(substr(md5(random()::text), 1, 8))),
    vehicle_id text references public.vehicles(id) on delete set null,
    driver_id text,
    customer_name text not null,
    customer_phone text not null,
    customer_line text,
    route text not null,
    travel_date text not null,
    total_days integer not null default 1 check (total_days >= 1),
    total_price numeric not null check (total_price >= 0),
    deposit_amount numeric not null check (deposit_amount >= 0),
    remaining_amount numeric not null check (remaining_amount >= 0),
    payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'expired')),
    chillpay_transaction_id text,
    chillpay_payment_url text,
    chillpay_qr_payload text,
    is_contact_unlocked boolean not null default false,
    created_at timestamptz not null default now(),
    paid_at timestamptz
);

-- Indexes for lightning-fast queries
create index if not exists idx_bookings_status on public.bookings(payment_status);
create index if not exists idx_bookings_vehicle_id on public.bookings(vehicle_id);
create index if not exists idx_bookings_customer_phone on public.bookings(customer_phone);
create index if not exists idx_bookings_created_at on public.bookings(created_at desc);
create index if not exists idx_bookings_chillpay_tx on public.bookings(chillpay_transaction_id);

-- Row Level Security (RLS)
alter table public.bookings enable row level security;

-- Policies for public bookings access with safe boundaries
-- Policies for bookings access with safe boundaries:
-- Public can create pending bookings; Reading, updating, and unlocking are strictly restricted to service_role
drop policy if exists "Allow public insert on bookings" on public.bookings;
create policy "Allow public insert on bookings"
    on public.bookings for insert
    with check (true);

drop policy if exists "Allow public select on bookings" on public.bookings;
create policy "Restrict read bookings to service_role"
    on public.bookings for select
    using (auth.role() = 'service_role');

drop policy if exists "Allow public update on bookings" on public.bookings;
create policy "Restrict update bookings to service_role"
    on public.bookings for update
    using (auth.role() = 'service_role');
