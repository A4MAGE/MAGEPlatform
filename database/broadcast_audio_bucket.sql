-- Storage bucket for broadcast audio files. Public read, authenticated write.
-- Files keyed by room id: broadcast-audio/{roomId}/{filename}

insert into storage.buckets (id, name, public)
values ('broadcast-audio', 'broadcast-audio', true)
on conflict (id) do nothing;

drop policy if exists "broadcast_audio_public_read"  on storage.objects;
drop policy if exists "broadcast_audio_auth_insert"  on storage.objects;
drop policy if exists "broadcast_audio_auth_delete"  on storage.objects;

create policy "broadcast_audio_public_read"
  on storage.objects for select
  using (bucket_id = 'broadcast-audio');

create policy "broadcast_audio_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'broadcast-audio' and auth.role() = 'authenticated');

create policy "broadcast_audio_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'broadcast-audio' and auth.role() = 'authenticated');
