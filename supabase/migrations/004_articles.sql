-- Editöryal blog yazıları (Markdown)
-- Tekrar çalıştırılabilir: CREATE IF NOT EXISTS + DROP POLICY IF EXISTS

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  city_slug TEXT,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_city_slug ON articles(city_slug) WHERE city_slug IS NOT NULL;

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read published articles" ON articles;
CREATE POLICY "Allow public read published articles"
  ON articles FOR SELECT TO anon, authenticated
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "Admin full access articles" ON articles;
CREATE POLICY "Admin full access articles"
  ON articles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );
