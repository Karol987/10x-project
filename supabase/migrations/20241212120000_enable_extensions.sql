-- migration: enable required postgresql extensions
-- purpose: enable uuid generation and trigram text search for fuzzy matching
-- affected: database extensions
-- considerations: these are standard supabase extensions and should be safe to enable

-- enable uuid generation (standard in supabase via pgcrypto)
create extension if not exists "pgcrypto";

-- enable trigram text search for fuzzy matching and autocomplete functionality
-- this will be used primarily for creator name searches
create extension if not exists "pg_trgm";









