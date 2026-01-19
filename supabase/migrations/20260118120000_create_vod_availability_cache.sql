-- migration: create vod_availability_cache table
-- purpose: cache streaming availability data from movie of the night api to minimize api calls
-- affected tables: vod_availability_cache (new)
-- special notes: 
--   - this table serves as a shared cache across all users to conserve api quota (100 requests/day)
--   - data is considered fresh for 24 hours before requiring refresh
--   - composite primary key ensures one cache entry per movie per country

-- create the vod availability cache table
-- stores streaming platform availability for movies identified by tmdb_id
create table public.vod_availability_cache (
  -- tmdb movie identifier
  tmdb_id integer not null,
  
  -- iso 3166-1 alpha-2 country code (e.g., 'pl', 'us')
  country_code text not null,
  
  -- json array of streaming platform objects with structure:
  -- [{ serviceId: string, name: string, link: string, type: 'subscription'|'rent'|'buy' }]
  -- empty array indicates movie is not available on any platform in this country
  availability_data jsonb not null,
  
  -- timestamp of when this cache entry was last updated
  -- used to determine if data needs refresh (24h ttl)
  last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- composite primary key ensures unique entry per movie per country
  primary key (tmdb_id, country_code)
);

-- create index for fast lookups by tmdb_id and country_code
-- this index supports the primary access pattern: "get availability for movie X in country Y"
create index vod_availability_cache_lookup_idx 
on public.vod_availability_cache (tmdb_id, country_code);

-- create index for cache cleanup operations
-- allows efficient queries to find stale entries based on last_updated_at
create index vod_availability_cache_updated_at_idx 
on public.vod_availability_cache (last_updated_at);

-- enable row level security on the cache table
-- even though this is a shared cache, rls must be enabled per supabase best practices
alter table public.vod_availability_cache enable row level security;

-- rls policy: allow all users (including anonymous) to read cache data
-- rationale: this is a shared cache of public streaming availability information
-- behavior: any user can query cached availability data to minimize api calls
create policy "allow select for anon users"
on public.vod_availability_cache
for select
to anon
using (true);

-- rls policy: allow authenticated users to read cache data
-- rationale: authenticated users should have same read access as anonymous users
-- behavior: any authenticated user can query cached availability data
create policy "allow select for authenticated users"
on public.vod_availability_cache
for select
to authenticated
using (true);

-- rls policy: allow authenticated users to insert new cache entries
-- rationale: when api route fetches new data from motn api, it needs to cache the result
-- behavior: any authenticated user can insert new cache entries (via api routes)
-- note: in production, consider restricting this to service_role only for tighter security
create policy "allow insert for authenticated users"
on public.vod_availability_cache
for insert
to authenticated
with check (true);

-- rls policy: allow authenticated users to update existing cache entries
-- rationale: when refreshing stale data (>24h old), the api route needs to update the cache
-- behavior: any authenticated user can update cache entries (via api routes)
-- note: in production, consider restricting this to service_role only for tighter security
create policy "allow update for authenticated users"
on public.vod_availability_cache
for update
to authenticated
using (true)
with check (true);

-- add comment to table for documentation
comment on table public.vod_availability_cache is 
'shared cache for movie streaming availability data from movie of the night api. reduces api calls by storing results for 24h. used by all users to conserve daily api quota (100 requests/day).';

-- add comments to columns for clarity
comment on column public.vod_availability_cache.tmdb_id is 
'the movie database (tmdb) unique identifier for the movie';

comment on column public.vod_availability_cache.country_code is 
'iso 3166-1 alpha-2 country code indicating which region''s availability is cached';

comment on column public.vod_availability_cache.availability_data is 
'jsonb array of streaming platforms where movie is available. empty array means not available on any tracked platform.';

comment on column public.vod_availability_cache.last_updated_at is 
'utc timestamp of last cache update. entries older than 24h should be refreshed from api.';
