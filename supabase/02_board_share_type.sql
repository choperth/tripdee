-- ==============================================================================
-- TripDee - Board type upgrade: allow 'share' (หาเพื่อนร่วมทริป / หารค่ารถ)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

alter table if exists public.board_posts drop constraint if exists board_posts_type_check;
alter table if exists public.board_posts add constraint board_posts_type_check
    check (type in ('request', 'share', 'offer'));
