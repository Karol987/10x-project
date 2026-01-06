-- migration: insert example platforms
-- purpose: add initial streaming platforms (Netflix, HBO Max, Disney+)
-- affected tables: platforms
-- considerations: uses TMDB provider IDs for external_provider_id

-- Insert example streaming platforms
-- Note: external_provider_id values are based on TMDB (The Movie Database) provider IDs
-- You can find these at: https://www.themoviedb.org/

INSERT INTO platforms (name, slug, external_provider_id, logo_url) VALUES
  ('Netflix', 'netflix', '8', '/logos/netflix.png'),
  ('HBO Max', 'hbo-max', '384', '/logos/hbo-max.png'),
  ('Disney+', 'disney-plus', '337', '/logos/disney-plus.png'),
  ('Amazon Prime Video', 'amazon-prime', '9', '/logos/amazon-prime.png'),
  ('Apple TV+', 'apple-tv-plus', '350', '/logos/apple-tv-plus.png'),
  ('Hulu', 'hulu', '15', '/logos/hulu.png')
ON CONFLICT (slug) DO NOTHING;

-- Note: ON CONFLICT clause ensures this migration is idempotent
-- If platforms already exist, they won't be duplicated
