-- migration: disable all row level security policies
-- purpose: disable all policies created in previous migrations
-- affected tables: profiles, platforms, user_platforms, creators, user_creators, watched_items
-- considerations: rls is still enabled on tables, only policies are dropped

-- disable policies on profiles table
drop policy if exists "users can select own profile" on profiles;
drop policy if exists "users can update own profile" on profiles;
drop policy if exists "users can delete own profile" on profiles;

-- disable policies on platforms table
drop policy if exists "authenticated users can select platforms" on platforms;
drop policy if exists "anonymous users can select platforms" on platforms;

-- disable policies on user_platforms table
drop policy if exists "users can select own platforms" on user_platforms;
drop policy if exists "users can insert own platforms" on user_platforms;
drop policy if exists "users can delete own platforms" on user_platforms;

-- disable policies on creators table
drop policy if exists "authenticated users can select creators" on creators;
drop policy if exists "anonymous users can select creators" on creators;

-- disable policies on user_creators table
drop policy if exists "users can select own creators" on user_creators;
drop policy if exists "users can insert own creators" on user_creators;
drop policy if exists "users can delete own creators" on user_creators;

-- disable policies on watched_items table
drop policy if exists "users can select own watched items" on watched_items;
drop policy if exists "users can insert own watched items" on watched_items;
drop policy if exists "users can update own watched items" on watched_items;
drop policy if exists "users can delete own watched items" on watched_items;

-- note: rls remains enabled on all tables
-- to fully disable rls, use: alter table <table_name> disable row level security;
-- without policies, rls will block all access except for service_role

