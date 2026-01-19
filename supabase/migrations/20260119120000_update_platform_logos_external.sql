-- migration: update platform logos to use local files
-- purpose: use logos from /public/logos/ directory
-- affected tables: platforms
-- considerations: logos are served from the application's public directory

-- Update platform logos to use local files from /public/logos/
UPDATE platforms SET logo_url = '/logos/netflix.png' WHERE slug = 'netflix';
UPDATE platforms SET logo_url = '/logos/hbo-max.png' WHERE slug = 'hbo-max';
UPDATE platforms SET logo_url = '/logos/disney-plus.png' WHERE slug = 'disney-plus';
UPDATE platforms SET logo_url = '/logos/amazon-prime.png' WHERE slug = 'amazon-prime';
UPDATE platforms SET logo_url = '/logos/apple-tv-plus.png' WHERE slug = 'apple-tv-plus';
UPDATE platforms SET logo_url = '/logos/hulu.png' WHERE slug = 'hulu';

-- Note: Logo files are stored in public/logos/ directory and served by Astro
