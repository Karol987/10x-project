-- migration: create creators table
-- purpose: global dictionary of content creators (actors/directors) cached from external api
-- affected tables: creators (new table)
-- considerations: shared data between users, service_role only writes, unique constraint on (external_api_id, creator_role)

-- creators: global dictionary of actors and directors
-- data is cached from external api (tmdb) and shared between all users
-- the same person can exist as both actor and director (separate records)
create table creators (
  -- primary key with uuid generation
  id uuid primary key default gen_random_uuid(),
  
  -- external_api_id: identifier from external api (e.g., tmdb person id)
  -- used to sync data and avoid duplicates
  external_api_id text not null,
  
  -- name: full name of the creator
  name text not null,
  
  -- creator_role: whether this record represents an actor or director
  -- the same person can have two records (one for each role)
  creator_role creator_role not null,
  
  -- avatar_url: path to creator's profile photo
  -- can be local path or external url
  avatar_url text,
  
  -- meta_data: jsonb field for caching additional api data
  -- examples: biography, birth_date, popularity, known_for, etc.
  -- this reduces api calls by storing frequently accessed data
  meta_data jsonb not null default '{}'::jsonb,
  
  -- last_synced_at: timestamp of last sync with external api
  -- used to determine when to refresh cached data
  last_synced_at timestamptz not null default now(),
  
  -- timestamp tracking
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- unique constraint: same person can be both actor and director, but not duplicate roles
  -- this enables filtering by role while allowing dual-role creators
  unique (external_api_id, creator_role),
  
  -- check constraint: ensure meta_data is always a json object, not array or primitive
  check (jsonb_typeof(meta_data) = 'object')
);

-- enable row level security
-- all users can read, only service_role can write
alter table creators enable row level security;

-- rls policy: authenticated users can view all creators
create policy "authenticated users can select creators"
  on creators
  for select
  to authenticated
  using (true);

-- rls policy: anonymous users can view all creators (for public pages)
create policy "anonymous users can select creators"
  on creators
  for select
  to anon
  using (true);

-- note: insert/update/delete restricted to service_role only
-- edge functions with service_role privileges handle syncing with external api
-- users only interact with creators via the user_creators junction table









