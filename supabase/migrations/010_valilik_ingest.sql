-- Valilik tanıtım içeriği ingest için kaynak ve kilit alanları
-- Tekrar çalıştırılabilir: ADD COLUMN IF NOT EXISTS

ALTER TABLE pages ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS content_source TEXT
  CHECK (content_source IN ('manual', 'valilik', 'ai', 'import'));

ALTER TABLE cities ADD COLUMN IF NOT EXISTS intro_source_url TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS cover_image_source TEXT
  CHECK (cover_image_source IN ('manual', 'valilik', 'wikimedia', 'ai', 'import'));
ALTER TABLE cities ADD COLUMN IF NOT EXISTS cover_image_locked BOOLEAN DEFAULT FALSE;

ALTER TABLE places ADD COLUMN IF NOT EXISTS cover_image_source TEXT
  CHECK (cover_image_source IN ('manual', 'valilik', 'wikimedia', 'ai', 'import'));
ALTER TABLE places ADD COLUMN IF NOT EXISTS cover_image_locked BOOLEAN DEFAULT FALSE;
