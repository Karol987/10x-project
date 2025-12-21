-- migration: create performance indexes
-- purpose: optimize query performance for common access patterns
-- affected tables: creators, watched_items, user_platforms, user_creators
-- considerations: indexes improve read performance but add write overhead

-- index on creators.name using trigram (gin)
-- purpose: enable fast autocomplete and fuzzy search for creator names
-- supports: like/ilike queries with '%search%' pattern
-- use case: creator search during onboarding (us-002)
create index idx_creators_name_trgm on creators using gin (name gin_trgm_ops);

-- index on creators.external_api_id
-- purpose: fast lookup when syncing data from external api
-- use case: checking if creator already exists before inserting from api
create index idx_creators_external_api_id on creators(external_api_id);

-- composite index on watched_items(user_id, created_at desc)
-- purpose: efficiently fetch user's watch history sorted by date (newest first)
-- use case: displaying watch history in user profile (us-008)
create index idx_watched_items_user_created on watched_items(user_id, created_at desc);

-- composite index on watched_items(user_id, external_movie_id)
-- purpose: fast filtering of recommendations to exclude already watched content
-- use case: recommendation algorithm checking if user has watched specific content
create index idx_watched_items_user_movie on watched_items(user_id, external_movie_id);

-- index on user_platforms.user_id
-- purpose: quickly fetch user's platform subscriptions
-- use case: loading user preferences during login and for recommendation filtering
create index idx_user_platforms_user_id on user_platforms(user_id);

-- index on user_creators.user_id
-- purpose: quickly fetch user's favorite creators
-- use case: loading creator preferences for recommendation algorithm
create index idx_user_creators_user_id on user_creators(user_id);









