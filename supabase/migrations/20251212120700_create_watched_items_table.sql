-- migration: create watched_items table
-- purpose: store user's watch history for exclusion from recommendations and profile display
-- affected tables: watched_items (new table)
-- considerations: denormalized title/year for sorting, jsonb cache for display data

-- watched_items: tracks movies and series marked as watched by users
-- used to filter recommendations and display watch history in user profile
create table watched_items (
  -- primary key
  id uuid primary key default gen_random_uuid(),
  
  -- foreign key to auth.users
  -- cascade delete ensures watch history is removed when user is deleted
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- external_movie_id: identifier from external api (e.g., tmdb movie/series id)
  -- used to link to external content data
  external_movie_id text not null,
  
  -- media_type: distinguishes between movie and series
  media_type media_type not null,
  
  -- title: denormalized title field for sorting and display
  -- stored locally to avoid api calls when listing watch history
  title text not null,
  
  -- year: production year for display and filtering
  year integer,
  
  -- meta_data: jsonb field for caching display data from api
  -- examples: poster_path, backdrop_path, overview, genres, rating
  -- this reduces api calls when displaying watch history
  meta_data jsonb not null default '{}'::jsonb,
  
  -- created_at: when the item was marked as watched
  -- used for sorting history (most recent first)
  created_at timestamptz not null default now(),
  
  -- unique constraint: prevent duplicate watched items
  -- a user can only mark a specific movie/series as watched once
  unique (user_id, external_movie_id, media_type),
  
  -- check constraint: ensure meta_data contains required poster_path field
  -- this ensures display data is always available without additional api calls
  check (meta_data ? 'poster_path')
);

-- enable row level security
-- users can only manage their own watch history
alter table watched_items enable row level security;

-- rls policy: users can view their own watch history
create policy "users can select own watched items"
  on watched_items
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: users can add to their own watch history
create policy "users can insert own watched items"
  on watched_items
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: users can update their own watch history
-- allows updating cached metadata without removing and re-adding
create policy "users can update own watched items"
  on watched_items
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: users can remove from their own watch history
create policy "users can delete own watched items"
  on watched_items
  for delete
  to authenticated
  using (auth.uid() = user_id);

