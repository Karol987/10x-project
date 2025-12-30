-- migration: create custom enum types
-- purpose: define enumerated types for consistent data validation
-- affected: database types
-- considerations: these enums ensure data consistency and provide type safety

-- creator_role: defines whether a creator is an actor or director
-- note: the same person can exist as both roles (handled by unique constraint in creators table)
create type creator_role as enum ('actor', 'director');

-- media_type: distinguishes between movies and tv series
-- used in watched_items table to properly categorize content
create type media_type as enum ('movie', 'series');

-- onboarding_status: tracks user's progress through the onboarding flow
-- workflow: not_started -> platforms_selected -> completed
create type onboarding_status as enum ('not_started', 'platforms_selected', 'completed');











