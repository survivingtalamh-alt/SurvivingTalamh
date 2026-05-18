-- ============================================================
-- SURVIVING TALAMH — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ----------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------

create table if not exists public.fan_art (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  artist_name   text not null check (char_length(artist_name) between 1 and 60),
  image_url     text not null,
  storage_path  text,
  description   text check (char_length(description) <= 280),
  approved      boolean not null default false
);

create index if not exists fan_art_approved_created_idx
  on public.fan_art (approved, created_at desc);

create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  author_name  text not null check (char_length(author_name) between 1 and 60),
  message      text not null check (char_length(message) between 1 and 500),
  approved     boolean not null default false
);

create index if not exists comments_approved_created_idx
  on public.comments (approved, created_at desc);

-- ----------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- ----------------------------------------------------------------

alter table public.fan_art enable row level security;
alter table public.comments enable row level security;

-- ---- fan_art policies ----

-- Anyone (including anon) can read approved art
drop policy if exists "anon read approved art" on public.fan_art;
create policy "anon read approved art"
  on public.fan_art for select
  to anon
  using (approved = true);

-- Anyone can submit new art (always inserted as pending)
drop policy if exists "anon submit pending art" on public.fan_art;
create policy "anon submit pending art"
  on public.fan_art for insert
  to anon
  with check (approved = false);

-- Authenticated (admin) can read everything
drop policy if exists "auth read all art" on public.fan_art;
create policy "auth read all art"
  on public.fan_art for select
  to authenticated
  using (true);

-- Authenticated can update (approve / unapprove)
drop policy if exists "auth update art" on public.fan_art;
create policy "auth update art"
  on public.fan_art for update
  to authenticated
  using (true)
  with check (true);

-- Authenticated can delete
drop policy if exists "auth delete art" on public.fan_art;
create policy "auth delete art"
  on public.fan_art for delete
  to authenticated
  using (true);

-- ---- comments policies ----

drop policy if exists "anon read approved comments" on public.comments;
create policy "anon read approved comments"
  on public.comments for select
  to anon
  using (approved = true);

drop policy if exists "anon submit pending comments" on public.comments;
create policy "anon submit pending comments"
  on public.comments for insert
  to anon
  with check (approved = false);

drop policy if exists "auth read all comments" on public.comments;
create policy "auth read all comments"
  on public.comments for select
  to authenticated
  using (true);

drop policy if exists "auth update comments" on public.comments;
create policy "auth update comments"
  on public.comments for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "auth delete comments" on public.comments;
create policy "auth delete comments"
  on public.comments for delete
  to authenticated
  using (true);

-- ----------------------------------------------------------------
-- 3. STORAGE BUCKET POLICIES
-- ----------------------------------------------------------------
-- NOTE: First create the storage bucket in the dashboard:
--   Storage → New Bucket → name: "fan-art" → Public bucket: ON
-- Then run the policies below.

-- Anyone can read images (bucket is public, but explicit policy too)
drop policy if exists "public read fan-art" on storage.objects;
create policy "public read fan-art"
  on storage.objects for select
  to public
  using (bucket_id = 'fan-art');

-- Anonymous visitors can upload (into pending/ folder only)
drop policy if exists "anon upload fan-art" on storage.objects;
create policy "anon upload fan-art"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'fan-art'
    and (storage.foldername(name))[1] = 'pending'
  );

-- Authenticated can move / delete (for moderation)
drop policy if exists "auth manage fan-art" on storage.objects;
create policy "auth manage fan-art"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'fan-art')
  with check (bucket_id = 'fan-art');
