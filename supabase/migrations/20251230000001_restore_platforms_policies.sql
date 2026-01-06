-- migration: restore platforms table policies
-- purpose: re-enable read access to platforms for all users
-- affected tables: platforms
-- considerations: platforms is public dictionary data, should be readable by everyone

-- rls policy: authenticated users can view all platforms
create policy "authenticated users can select platforms"
  on platforms
  for select
  to authenticated
  using (true);

-- rls policy: anonymous users can view all platforms (for public pages)
create policy "anonymous users can select platforms"
  on platforms
  for select
  to anon
  using (true);

-- note: insert/update/delete restricted to service_role only
-- no policies needed as service_role bypasses rls
