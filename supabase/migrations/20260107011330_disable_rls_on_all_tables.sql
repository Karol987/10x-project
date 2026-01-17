-- migration: disable row level security on all tables
-- purpose: fully disable rls since policies have been dropped
-- affected tables: profiles, platforms, user_platforms, creators, user_creators, watched_items
-- considerations: this allows full access to all tables without authentication checks

-- disable rls on profiles table
alter table profiles disable row level security;

-- disable rls on platforms table
alter table platforms disable row level security;

-- disable rls on user_platforms table
alter table user_platforms disable row level security;

-- disable rls on creators table
alter table creators disable row level security;

-- disable rls on user_creators table
alter table user_creators disable row level security;

-- disable rls on watched_items table
alter table watched_items disable row level security;

-- note: with rls disabled, all operations will succeed regardless of authentication
-- this is suitable for development but should be re-enabled with proper policies in production
