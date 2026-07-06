-- Belediye mekan ingest + yazı detay reklam pozisyonları

ALTER TABLE places DROP CONSTRAINT IF EXISTS places_source_check;
ALTER TABLE places ADD CONSTRAINT places_source_check
  CHECK (source IN ('osm', 'wikidata', 'google', 'manual', 'belediye'));

ALTER TABLE places ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE places DROP CONSTRAINT IF EXISTS places_cover_image_source_check;
ALTER TABLE places ADD CONSTRAINT places_cover_image_source_check
  CHECK (cover_image_source IN ('manual', 'valilik', 'wikimedia', 'ai', 'import', 'belediye'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_places_source_url
  ON places(source_url)
  WHERE source_url IS NOT NULL;

INSERT INTO ad_placements (name, position, is_active) VALUES
  ('Yazı Detay — Üst', 'article-content-top', true),
  ('Yazı Detay — Alt', 'article-content-bottom', true)
ON CONFLICT (position) DO UPDATE SET
  name = EXCLUDED.name;
