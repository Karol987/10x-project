-- migration: create user_creators junction table
-- purpose: link users with their favorite creators (m:n relationship)
-- affected tables: user_creators (new table)
-- considerations: cascade deletes, unique constraint prevents duplicate favorites

-- user_creators: links users to their favorite actors/directors
-- this is a many-to-many relationship table between auth.users and creators
create table user_creators (
  -- primary key
  id uuid primary key default gen_random_uuid(),
  
  -- foreign key to auth.users
  -- cascade delete ensures favorites are removed when user is deleted
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- foreign key to creators
  -- cascade delete ensures orphaned records are removed if creator is deleted
  creator_id uuid not null references creators(id) on delete cascade,
  
  -- timestamp tracking
  created_at timestamptz not null default now(),
  
  -- unique constraint: prevent duplicate favorites for the same user
  -- a user can only favorite a specific creator once
  unique (user_id, creator_id)
);

-- enable row level security
-- users can only manage their own favorite creators
alter table user_creators enable row level security;

-- rls policy: users can view their own favorite creators
create policy "users can select own creators"
  on user_creators
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: users can add their own favorite creators
create policy "users can insert own creators"
  on user_creators
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: users can remove their own favorite creators
create policy "users can delete own creators"
  on user_creators
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- note: update not needed as there are no mutable fields beyond id/timestamps











