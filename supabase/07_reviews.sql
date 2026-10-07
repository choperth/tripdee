-- 07_reviews.sql
--
-- Reviews previously lived only in browser localStorage and were augmented
-- with generated placeholder reviews, so a customer's review was invisible to
-- the driver, to administrators, and to every other visitor.
--
-- `verified_trip` is derived from a completed booking, never from the client.
--
-- Run once in the Supabase SQL Editor. Idempotent.

create table if not exists public.reviews (
    id text primary key default ('rev-' || substr(md5(random()::text), 1, 12)),
    vehicle_id text not null,
    author_name text not null,
    author_phone text,
    rating integer not null check (rating between 1 and 5),
    travel_date text,
    trip_route text,
    comment text not null,
    tags text[] default array[]::text[],
    driver_reply text,
    driver_reply_date text,
    verified_trip boolean default false,
    created_at timestamptz default now(),
    constraint reviews_vehicle_fk
      foreign key (vehicle_id) references public.vehicles (id) on delete cascade
);

create index if not exists idx_reviews_vehicle_id on public.reviews(vehicle_id);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

-- ---------------------------------------------------------------------------
-- Recompute the vehicle's cached rating / review_count from real reviews.
-- A vehicle with no reviews is stored as rating 0 / review_count 0 so it can
-- never present a perfect score it has not earned.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_vehicle_rating(target_vehicle_id text)
returns void
language plpgsql
as $$
declare
    avg_rating numeric;
    total integer;
begin
    select round(avg(rating)::numeric, 1), count(*)
      into avg_rating, total
      from public.reviews
     where vehicle_id = target_vehicle_id;

    update public.vehicles
       set rating = coalesce(avg_rating, 0),
           review_count = coalesce(total, 0)
     where id = target_vehicle_id;
end;
$$;

-- Backfill: vehicles with no reviews must not carry an unearned star score.
update public.vehicles
   set rating = 0,
       review_count = 0
 where review_count is null or review_count = 0;

-- ---------------------------------------------------------------------------
-- Row Level Security
--   Anyone may read reviews. Nothing else is granted to anon/authenticated:
--   all writes go through /api/reviews on the service role key, which is the
--   only place that can derive `verified_trip` from a paid booking and attach
--   `driver_reply`. Leaving insert open to the anon key would let anyone post
--   a self-declared verified review or a forged driver reply.
-- ---------------------------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists "Allow public select on reviews" on public.reviews;
create policy "Allow public select on reviews"
  on public.reviews for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow public insert on reviews" on public.reviews;
drop policy if exists "Restrict update reviews to service_role" on public.reviews;
drop policy if exists "Restrict delete reviews to service_role" on public.reviews;
