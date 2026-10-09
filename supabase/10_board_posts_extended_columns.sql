-- ==============================================================================
-- Migration 10: Ensure board_posts has all extended community dispatch columns
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Add missing columns to board_posts (if they don't already exist)
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS category text default 'general';
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS pin text;
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS view_token text;
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS is_closed boolean default false;
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS is_negotiable boolean default false;
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS max_quotes integer default 3;
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS quote_count integer default 0;
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS accepted_quote_id text;
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS author_whatsapp text;
ALTER TABLE public.board_posts ADD COLUMN IF NOT EXISTS author_wechat text;

-- 2. Create indices for fast query lookups
CREATE INDEX IF NOT EXISTS idx_board_posts_category ON public.board_posts(category);
CREATE INDEX IF NOT EXISTS idx_board_posts_is_closed ON public.board_posts(is_closed);
CREATE INDEX IF NOT EXISTS idx_board_posts_view_token ON public.board_posts(view_token);

-- 3. Ensure board_quotes table exists for driver quotations
CREATE TABLE IF NOT EXISTS public.board_quotes (
    id text primary key default ('q-' || substr(md5(random()::text), 1, 8)),
    post_id text not null references public.board_posts(id) on delete cascade,
    driver_name text not null,
    driver_phone text not null,
    driver_line text,
    vehicle_model text not null,
    price numeric not null,
    price_note text,
    message text,
    is_accepted boolean default false,
    created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_board_quotes_post_id ON public.board_quotes(post_id);
CREATE INDEX IF NOT EXISTS idx_board_quotes_created_at ON public.board_quotes(created_at desc);

-- 4. Enable Row Level Security (RLS) policies for community quotes & posts
ALTER TABLE public.board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on board_posts" ON public.board_posts;
CREATE POLICY "Allow public select on board_posts" ON public.board_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on board_posts" ON public.board_posts;
CREATE POLICY "Allow public insert on board_posts" ON public.board_posts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on board_posts" ON public.board_posts;
CREATE POLICY "Allow public update on board_posts" ON public.board_posts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select on board_quotes" ON public.board_quotes;
CREATE POLICY "Allow public select on board_quotes" ON public.board_quotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on board_quotes" ON public.board_quotes;
CREATE POLICY "Allow public insert on board_quotes" ON public.board_quotes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on board_quotes" ON public.board_quotes;
CREATE POLICY "Allow public update on board_quotes" ON public.board_quotes FOR UPDATE USING (true);
