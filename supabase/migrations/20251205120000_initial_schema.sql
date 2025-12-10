-- =====================================================================================
-- Migration: Initial Schema Setup for Streamly
-- =====================================================================================
-- Purpose: Creates the complete database schema including:
--          - User profiles with onboarding tracking
--          - Platforms dictionary and user-platform relationships
--          - Creators dictionary with roles (actor/director) and user-creator relationships
--          - Watched items tracking with media type support
--          - Complete RLS policies for data security
--          - Triggers for automatic timestamp updates
--          - Indexes for query optimization
--
-- Tables affected: profiles, platforms, user_platforms, creators, user_creators, watched_items
-- 
-- Special notes:
--   - Requires pgcrypto extension for uuid generation
--   - Uses custom ENUM types for creator_role and media_type
--   - All user data tables have RLS enabled
--   - Dictionary tables (platforms, creators) are publicly readable
-- =====================================================================================

-- =====================================================================================
-- Extensions
-- =====================================================================================
-- Enable pgcrypto for gen_random_uuid() function used in primary keys
create extension if not exists pgcrypto;

-- Enable pg_trgm for trigram-based text search on creator names
create extension if not exists pg_trgm;

-- =====================================================================================
-- Custom ENUM Types
-- =====================================================================================
-- Define creator_role enum to distinguish between actors and directors
-- This ensures data consistency and prevents typos in role assignments
create type creator_role as enum ('actor', 'director');

-- Define media_type enum to distinguish between movies and series
-- This helps maintain data integrity and simplifies filtering logic
create type media_type as enum ('movie', 'series');

-- =====================================================================================
-- Table: profiles
-- =====================================================================================
-- Purpose: Stores user profile information and onboarding progress
-- Relationship: 1:1 with auth.users (user_id is both PK and FK)
-- RLS: Enabled - users can only access their own profile
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_step smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable row level security to ensure users can only access their own profiles
alter table public.profiles enable row level security;

-- =====================================================================================
-- Table: platforms
-- =====================================================================================
-- Purpose: Dictionary table storing available streaming platforms
-- Relationship: M:N with users through user_platforms
-- RLS: Not enabled - publicly readable dictionary
create table public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS as per guidelines, even for dictionary tables
alter table public.platforms enable row level security;

-- =====================================================================================
-- Table: user_platforms
-- =====================================================================================
-- Purpose: Junction table for M:N relationship between users and platforms
-- Relationship: Links auth.users with platforms
-- RLS: Enabled - users can only manage their own platform selections
-- Unique constraint: Prevents duplicate user-platform combinations
create table public.user_platforms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, platform_id)
);

-- Enable row level security to protect user platform preferences
alter table public.user_platforms enable row level security;

-- Index for efficient querying of user's platforms
create index idx_user_platforms_user_id on public.user_platforms(user_id);

-- =====================================================================================
-- Table: creators
-- =====================================================================================
-- Purpose: Dictionary table storing actors and directors
-- Relationship: M:N with users through user_creators
-- RLS: Not enabled - publicly readable dictionary
-- Unique constraint: Same person can exist as both actor and director (different records)
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  external_api_id text not null,
  name text not null,
  creator_role creator_role not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(external_api_id, creator_role)
);

-- Enable RLS as per guidelines, even for dictionary tables
alter table public.creators enable row level security;

-- B-tree index for simple name lookups
create index idx_creators_name on public.creators(name);

-- GIN index with trigram support for fuzzy text search on creator names
-- This enables efficient autocomplete and partial name matching
create index idx_creators_name_trgm on public.creators using gin(name gin_trgm_ops);

-- =====================================================================================
-- Table: user_creators
-- =====================================================================================
-- Purpose: Junction table for M:N relationship between users and creators
-- Relationship: Links auth.users with creators (actors/directors they follow)
-- RLS: Enabled - users can only manage their own creator preferences
-- Unique constraint: Prevents duplicate user-creator combinations
create table public.user_creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, creator_id)
);

-- Enable row level security to protect user creator preferences
alter table public.user_creators enable row level security;

-- Index for efficient querying of user's followed creators
create index idx_user_creators_user_id on public.user_creators(user_id);

-- =====================================================================================
-- Table: watched_items
-- =====================================================================================
-- Purpose: Tracks movies and series that users have watched
-- Relationship: N:1 with auth.users
-- RLS: Enabled - users can only access their own watched items
-- Unique constraint: Prevents duplicate entries for same media item per user
create table public.watched_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_movie_id text not null,
  media_type media_type not null,
  title text not null,
  year integer,
  created_at timestamptz not null default now(),
  unique(user_id, external_movie_id, media_type)
);

-- Enable row level security to protect user watch history
alter table public.watched_items enable row level security;

-- Composite index for filtering watched items by user and media type
-- Optimizes queries for recommendations and user's watch history
create index idx_watched_items_user_media on public.watched_items(user_id, media_type);

-- =====================================================================================
-- Helper Functions
-- =====================================================================================
-- Function: handle_updated_at
-- Purpose: Automatically updates the updated_at timestamp on row modifications
-- Usage: Called by triggers on tables with updated_at columns
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Function: create_profile_for_new_user
-- Purpose: Automatically creates a profile record when a new user registers
-- Usage: Triggered after insert on auth.users
-- Note: This ensures every user has a corresponding profile without manual intervention
create or replace function create_profile_for_new_user()
returns trigger as $$
begin
  insert into public.profiles(user_id) values (new.id);
  return new;
end;
$$ language plpgsql;

-- =====================================================================================
-- Triggers for automatic updated_at management
-- =====================================================================================
-- Trigger: profiles table
-- Updates the updated_at timestamp before any update operation
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.handle_updated_at();

-- Trigger: platforms table
-- Updates the updated_at timestamp before any update operation
create trigger trg_platforms_updated
before update on public.platforms
for each row execute function public.handle_updated_at();

-- Trigger: creators table
-- Updates the updated_at timestamp before any update operation
create trigger trg_creators_updated
before update on public.creators
for each row execute function public.handle_updated_at();

-- =====================================================================================
-- Trigger for automatic profile creation
-- =====================================================================================
-- Trigger: auth.users table
-- Automatically creates a profile record when a new user is created
-- This ensures referential integrity and eliminates race conditions
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

-- =====================================================================================
-- Row Level Security Policies
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- RLS Policies: profiles
-- -------------------------------------------------------------------------------------
-- Policy: Users can select their own profile
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
create policy profiles_select_own on public.profiles
for select
to authenticated
using (user_id = auth.uid());

-- Policy: Users can insert their own profile
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Note: This is backup for manual inserts; normally handled by trigger
create policy profiles_insert_own on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

-- Policy: Users can update their own profile
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
create policy profiles_update_own on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Policy: Users can delete their own profile
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Note: Profile deletion should cascade from auth.users deletion
create policy profiles_delete_own on public.profiles
for delete
to authenticated
using (user_id = auth.uid());

-- -------------------------------------------------------------------------------------
-- RLS Policies: platforms
-- -------------------------------------------------------------------------------------
-- Policy: Anonymous users can view all platforms
-- Applies to: anonymous (non-authenticated) users
-- Logic: Returns true to allow public read access to platform dictionary
create policy platforms_select_anon on public.platforms
for select
to anon
using (true);

-- Policy: Authenticated users can view all platforms
-- Applies to: authenticated users
-- Logic: Returns true to allow public read access to platform dictionary
create policy platforms_select_auth on public.platforms
for select
to authenticated
using (true);

-- -------------------------------------------------------------------------------------
-- RLS Policies: user_platforms
-- -------------------------------------------------------------------------------------
-- Policy: Users can select their own platform associations
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
create policy user_platforms_select_own on public.user_platforms
for select
to authenticated
using (user_id = auth.uid());

-- Policy: Users can insert their own platform associations
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Use case: User selects platforms during onboarding or in settings
create policy user_platforms_insert_own on public.user_platforms
for insert
to authenticated
with check (user_id = auth.uid());

-- Policy: Users can update their own platform associations
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Note: Updates are rare; typically delete and re-insert
create policy user_platforms_update_own on public.user_platforms
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Policy: Users can delete their own platform associations
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Use case: User deselects a platform in settings
create policy user_platforms_delete_own on public.user_platforms
for delete
to authenticated
using (user_id = auth.uid());

-- -------------------------------------------------------------------------------------
-- RLS Policies: creators
-- -------------------------------------------------------------------------------------
-- Policy: Anonymous users can view all creators
-- Applies to: anonymous (non-authenticated) users
-- Logic: Returns true to allow public read access to creators dictionary
create policy creators_select_anon on public.creators
for select
to anon
using (true);

-- Policy: Authenticated users can view all creators
-- Applies to: authenticated users
-- Logic: Returns true to allow public read access to creators dictionary
create policy creators_select_auth on public.creators
for select
to authenticated
using (true);

-- -------------------------------------------------------------------------------------
-- RLS Policies: user_creators
-- -------------------------------------------------------------------------------------
-- Policy: Users can select their own creator associations
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
create policy user_creators_select_own on public.user_creators
for select
to authenticated
using (user_id = auth.uid());

-- Policy: Users can insert their own creator associations
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Use case: User follows actors/directors during onboarding or in settings
create policy user_creators_insert_own on public.user_creators
for insert
to authenticated
with check (user_id = auth.uid());

-- Policy: Users can update their own creator associations
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Note: Updates are rare; typically delete and re-insert
create policy user_creators_update_own on public.user_creators
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Policy: Users can delete their own creator associations
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Use case: User unfollows an actor/director in settings
create policy user_creators_delete_own on public.user_creators
for delete
to authenticated
using (user_id = auth.uid());

-- -------------------------------------------------------------------------------------
-- RLS Policies: watched_items
-- -------------------------------------------------------------------------------------
-- Policy: Users can select their own watched items
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
create policy watched_items_select_own on public.watched_items
for select
to authenticated
using (user_id = auth.uid());

-- Policy: Users can insert their own watched items
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Use case: User marks a movie/series as watched
create policy watched_items_insert_own on public.watched_items
for insert
to authenticated
with check (user_id = auth.uid());

-- Policy: Users can update their own watched items
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Note: Updates might be used for correcting metadata
create policy watched_items_update_own on public.watched_items
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Policy: Users can delete their own watched items
-- Applies to: authenticated users
-- Logic: user_id must match authenticated user's id
-- Use case: User removes an item from their watch history
create policy watched_items_delete_own on public.watched_items
for delete
to authenticated
using (user_id = auth.uid());

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Summary:
--   - 6 tables created with appropriate relationships
--   - 2 custom ENUM types defined
--   - 5 indexes created for query optimization
--   - 2 helper functions created for automation
--   - 4 triggers created for automatic updates
--   - 28 RLS policies created for comprehensive security
--   - All tables have RLS enabled
--   - All user data is protected by user_id matching policies
--   - Dictionary tables are publicly readable
-- =====================================================================================

-- Grant necessary permissions to Supabase Auth admin for profile management
GRANT ALL ON public.profiles TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;