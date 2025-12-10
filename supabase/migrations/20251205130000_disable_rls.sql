-- =====================================================================================
-- Migration: Disable RLS Policies and Row Level Security
-- =====================================================================================
-- Purpose: Disables all RLS policies and Row Level Security on all tables
--
-- Tables affected: profiles, platforms, user_platforms, creators, user_creators, watched_items
-- 
-- WARNING: This removes all security policies. All data will be accessible without restrictions.
-- =====================================================================================

-- =====================================================================================
-- Drop RLS Policies: profiles
-- =====================================================================================
drop policy if exists profiles_select_own on profiles;
drop policy if exists profiles_insert_own on profiles;
drop policy if exists profiles_update_own on profiles;
drop policy if exists profiles_delete_own on profiles;

-- =====================================================================================
-- Drop RLS Policies: platforms
-- =====================================================================================
drop policy if exists platforms_select_anon on platforms;
drop policy if exists platforms_select_auth on platforms;

-- =====================================================================================
-- Drop RLS Policies: user_platforms
-- =====================================================================================
drop policy if exists user_platforms_select_own on user_platforms;
drop policy if exists user_platforms_insert_own on user_platforms;
drop policy if exists user_platforms_update_own on user_platforms;
drop policy if exists user_platforms_delete_own on user_platforms;

-- =====================================================================================
-- Drop RLS Policies: creators
-- =====================================================================================
drop policy if exists creators_select_anon on creators;
drop policy if exists creators_select_auth on creators;

-- =====================================================================================
-- Drop RLS Policies: user_creators
-- =====================================================================================
drop policy if exists user_creators_select_own on user_creators;
drop policy if exists user_creators_insert_own on user_creators;
drop policy if exists user_creators_update_own on user_creators;
drop policy if exists user_creators_delete_own on user_creators;

-- =====================================================================================
-- Drop RLS Policies: watched_items
-- =====================================================================================
drop policy if exists watched_items_select_own on watched_items;
drop policy if exists watched_items_insert_own on watched_items;
drop policy if exists watched_items_update_own on watched_items;
drop policy if exists watched_items_delete_own on watched_items;

-- =====================================================================================
-- Disable Row Level Security on All Tables
-- =====================================================================================
alter table profiles disable row level security;
alter table platforms disable row level security;
alter table user_platforms disable row level security;
alter table creators disable row level security;
alter table user_creators disable row level security;
alter table watched_items disable row level security;

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Summary:
--   - 20 RLS policies dropped from 6 tables
--   - Row Level Security disabled on 6 tables
--   - All data is now accessible without restrictions
-- =====================================================================================

