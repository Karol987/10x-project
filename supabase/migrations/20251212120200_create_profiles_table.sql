-- migration: create profiles table
-- purpose: extend auth.users with application-specific user data
-- affected tables: profiles (new table)
-- considerations: 1:1 relationship with auth.users, auto-created via trigger

-- profiles: stores user preferences and onboarding state
-- this extends the auth.users table with application-specific data
create table profiles (
  -- primary key and foreign key to auth.users
  -- cascade delete ensures profile is removed when user account is deleted
  user_id uuid primary key references auth.users(id) on delete cascade,
  
  -- country_code: used for api calls to determine content availability by region
  -- defaults to 'PL' (Poland), must be ISO 3166-1 alpha-2 format
  country_code char(2) not null default 'PL',
  
  -- onboarding_status: tracks progress through user onboarding flow
  -- workflow: not_started -> platforms_selected -> completed
  onboarding_status onboarding_status not null default 'not_started',
  
  -- timestamp tracking
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security
-- users can only access their own profile
alter table profiles enable row level security;

-- rls policy: users can view their own profile
create policy "users can select own profile"
  on profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: users can update their own profile
create policy "users can update own profile"
  on profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: users can delete their own profile
create policy "users can delete own profile"
  on profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- note: insert is handled by trigger, no direct insert policy needed
-- the trigger runs with security definer to bypass rls

