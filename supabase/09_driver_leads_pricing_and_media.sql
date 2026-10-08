-- 09_driver_leads_pricing_and_media.sql
--
-- Adds self-service pricing, description, exterior/interior photos, and owner linkage
-- to the driver_leads table.
--
-- This ensures that when new drivers register via DriverRegisterModal, their custom
-- initial daily rate, rich description, and uploaded vehicle photos persist permanently
-- in Supabase, and can be converted seamlessly into vehicles table records.
--
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).

alter table public.driver_leads
  add column if not exists owner_id text,
  add column if not exists price_per_day numeric,
  add column if not exists description text,
  add column if not exists images text[];

-- Index for owner lookups when a logged-in driver opens their portal
create index if not exists idx_driver_leads_owner_id on public.driver_leads(owner_id);
