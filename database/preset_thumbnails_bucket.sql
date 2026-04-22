-- Storage bucket for preset thumbnails. Public read, authenticated write.
-- One file per preset, keyed by preset id: preset-thumbnails/{preset_id}.png
-- Idempotent: safe to re-run.

insert into storage.buckets (id, name, public)
values ('preset-thumbnails', 'preset-thumbnails', true)
on conflict (id) do nothing;

-- Policies: public read, authenticated users can insert/update/delete.
drop policy if exists "preset_thumbnails_public_read"    on storage.objects;
drop policy if exists "preset_thumbnails_auth_insert"    on storage.objects;
drop policy if exists "preset_thumbnails_auth_update"    on storage.objects;
drop policy if exists "preset_thumbnails_auth_delete"    on storage.objects;

create policy "preset_thumbnails_public_read"
  on storage.objects for select
  using (bucket_id = 'preset-thumbnails');

create policy "preset_thumbnails_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'preset-thumbnails' and auth.role() = 'authenticated');

create policy "preset_thumbnails_auth_update"
  on storage.objects for update
  using (bucket_id = 'preset-thumbnails' and auth.role() = 'authenticated')
  with check (bucket_id = 'preset-thumbnails' and auth.role() = 'authenticated');

create policy "preset_thumbnails_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'preset-thumbnails' and auth.role() = 'authenticated');
