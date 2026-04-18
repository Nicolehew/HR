-- Storage RLS policies
-- Drivers can only access their own files; boss can access all.
-- File paths:
--   receipts/{driver_id}/{timestamp}.{ext}
--   payslips/{driver_id}/{year}-{month}.pdf

-- Receipts: driver uploads and reads own files; boss reads all
create policy "driver_upload_own_receipts" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and
    (storage.foldername(name))[1] in (
      select id::text from drivers where auth_id = auth.uid()
    )
  );

create policy "driver_read_own_receipts" on storage.objects
  for select using (
    bucket_id = 'receipts' and (
      (storage.foldername(name))[1] in (
        select id::text from drivers where auth_id = auth.uid()
      )
      or
      exists (
        select 1 from drivers where auth_id = auth.uid() and role = 'boss'
      )
    )
  );

-- Payslips: driver reads own; boss reads/writes all (service role bypasses RLS for uploads)
create policy "driver_read_own_payslips" on storage.objects
  for select using (
    bucket_id = 'payslips' and (
      (storage.foldername(name))[1] in (
        select id::text from drivers where auth_id = auth.uid()
      )
      or
      exists (
        select 1 from drivers where auth_id = auth.uid() and role = 'boss'
      )
    )
  );

create policy "boss_write_payslips" on storage.objects
  for insert with check (
    bucket_id = 'payslips' and
    exists (
      select 1 from drivers where auth_id = auth.uid() and role = 'boss'
    )
  );

create policy "boss_update_payslips" on storage.objects
  for update using (
    bucket_id = 'payslips' and
    exists (
      select 1 from drivers where auth_id = auth.uid() and role = 'boss'
    )
  );
