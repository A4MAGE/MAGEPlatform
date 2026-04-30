-- Migration: add playback state columns + fix all RLS policies
-- Run this in Supabase SQL Editor

alter table broadcast_room
  add column if not exists is_playing boolean not null default false,
  add column if not exists current_time numeric not null default 0;

-- Drop and recreate all policies cleanly
drop policy if exists "Authenticated users can read active rooms" on broadcast_room;
drop policy if exists "Host can read own rooms" on broadcast_room;
drop policy if exists "Host can insert own room" on broadcast_room;
drop policy if exists "Host can update own room" on broadcast_room;
drop policy if exists "Host can delete own room" on broadcast_room;

-- Anyone authenticated can read active rooms
create policy "read active rooms" on broadcast_room
  for select using (auth.uid() is not null);

-- Host inserts their own room
create policy "host insert" on broadcast_room
  for insert with check (auth.uid() = host_user_id);

-- Host updates their own room
create policy "host update" on broadcast_room
  for update using (auth.uid() = host_user_id)
  with check (auth.uid() = host_user_id);

-- Host deletes their own room
create policy "host delete" on broadcast_room
  for delete using (auth.uid() = host_user_id);

-- Enable realtime on this table (Postgres Changes)
alter publication supabase_realtime add table broadcast_room;
