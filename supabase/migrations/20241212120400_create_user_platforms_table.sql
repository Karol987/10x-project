-- migration: create user_platforms junction table
-- purpose: link users with their subscribed streaming platforms (m:n relationship)
-- affected tables: user_platforms (new table)
-- considerations: cascade deletes, unique constraint prevents duplicate subscriptions

-- user_platforms: links users to their streaming platform subscriptions
-- this is a many-to-many relationship table between auth.users and platforms
create table user_platforms (
  -- primary key
  id uuid primary key default gen_random_uuid(),
  
  -- foreign key to auth.users
  -- cascade delete ensures subscriptions are removed when user is deleted
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- foreign key to platforms
  -- cascade delete ensures orphaned records are removed if platform is deleted
  platform_id uuid not null references platforms(id) on delete cascade,
  
  -- timestamp tracking
  created_at timestamptz not null default now(),
  
  -- unique constraint: prevent duplicate subscriptions for the same user
  -- a user can only have one subscription record per platform
  unique (user_id, platform_id)
);

-- enable row level security
-- users can only manage their own platform subscriptions
alter table user_platforms enable row level security;

-- rls policy: users can view their own subscriptions
create policy "users can select own platforms"
  on user_platforms
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: users can add their own subscriptions
create policy "users can insert own platforms"
  on user_platforms
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: users can remove their own subscriptions
create policy "users can delete own platforms"
  on user_platforms
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- note: update not needed as there are no mutable fields beyond id/timestamps




