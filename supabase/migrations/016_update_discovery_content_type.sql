-- 016_update_discovery_content_type.sql
-- Allow 'news' in discovered_content content_type check constraint

ALTER TABLE discovered_content DROP CONSTRAINT IF EXISTS discovered_content_content_type_check;

ALTER TABLE discovered_content ADD CONSTRAINT discovered_content_content_type_check
  CHECK (content_type IN ('news', 'event', 'article', 'unknown', 'skip'));
