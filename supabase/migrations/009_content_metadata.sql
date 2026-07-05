-- İçerik meta veri alanları (SEO)
-- Tekrar çalıştırılabilir: ADD COLUMN IF NOT EXISTS

-- places
ALTER TABLE places ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- cities
ALTER TABLE cities ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- cultural_events
ALTER TABLE cultural_events ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE cultural_events ADD COLUMN IF NOT EXISTS meta_description TEXT;
