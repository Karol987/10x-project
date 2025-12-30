-- migration: create platforms table
-- purpose: store vod platform definitions (netflix, hbo, etc)
-- affected tables: platforms (new table)
-- considerations: this is a managed dictionary table, admin-only writes

-- platforms: global dictionary of streaming platforms
-- managed by administrators/system, users only read from this table
create table platforms (
  -- primary key with uuid generation
  id uuid primary key default gen_random_uuid(),
  
  -- name: display name for the platform (e.g., "Netflix", "HBO Max")
  name text not null,
  
  -- slug: url-friendly identifier for the platform (e.g., "netflix", "hbo-max")
  -- used in urls and api calls
  slug text not null unique,
  
  -- external_provider_id: identifier used by external apis (e.g., tmdb provider id)
  -- this links the platform to external data sources for availability checking
  external_provider_id text not null,
  
  -- logo_url: path to platform logo image
  -- can be local path or external url
  logo_url text,
  
  -- timestamp tracking
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security
-- authenticated users can read, only service_role can write
alter table platforms enable row level security;

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











