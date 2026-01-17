-- migration: insert example platforms
-- purpose: add initial streaming platforms (Netflix, HBO Max, Disney+)
-- affected tables: platforms
-- considerations: uses TMDB provider IDs for external_provider_id and fixed UUIDs

-- Insert example streaming platforms with fixed UUIDs
-- Note: external_provider_id values are based on TMDB (The Movie Database) provider IDs
-- You can find these at: https://www.themoviedb.org/
-- Fixed UUIDs ensure consistency across database resets

INSERT INTO platforms (id, name, slug, external_provider_id, logo_url) VALUES
  ('b6d51dec-54a9-4da3-8ef9-f02345bff45d', 'Netflix', 'netflix', '8', '/logos/netflix.png'),
  ('c7e62fed-65ba-5eb4-9fea-a13456bcc56e', 'HBO Max', 'hbo-max', '384', '/logos/hbo-max.png'),
  ('d8f73afe-76cb-6fc5-aafb-b24567dbb67f', 'Disney+', 'disney-plus', '337', '/logos/disney-plus.png'),
  ('e9a84baf-87dc-7ad6-bbac-c35678ebb78a', 'Amazon Prime Video', 'amazon-prime', '9', '/logos/amazon-prime.png'),
  ('fab95cba-98ed-8be7-cbbd-d46789fbb89b', 'Apple TV+', 'apple-tv-plus', '350', '/logos/apple-tv-plus.png'),
  ('abb06dca-a9fe-9cf8-dcce-e5789accc90c', 'Hulu', 'hulu', '15', '/logos/hulu.png')
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  external_provider_id = EXCLUDED.external_provider_id,
  logo_url = EXCLUDED.logo_url;

-- Note: ON CONFLICT clause ensures this migration is idempotent
-- If platforms already exist, they will be updated with the fixed UUIDs
