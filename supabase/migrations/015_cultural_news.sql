-- Kültür & Sanat Haberleri tablosu
CREATE TABLE IF NOT EXISTS cultural_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  city_slug TEXT,
  category TEXT NOT NULL DEFAULT 'genel',
  source_name TEXT,
  source_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cultural_news_slug ON cultural_news(slug);
CREATE INDEX IF NOT EXISTS idx_cultural_news_published ON cultural_news(is_published, published_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_cultural_news_featured ON cultural_news(is_featured, published_at DESC) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_cultural_news_city_slug ON cultural_news(city_slug) WHERE city_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cultural_news_category ON cultural_news(category);

ALTER TABLE cultural_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read published cultural news" ON cultural_news;
CREATE POLICY "Allow public read published cultural news"
  ON cultural_news FOR SELECT TO anon, authenticated
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "Admin full access cultural news" ON cultural_news;
CREATE POLICY "Admin full access cultural news"
  ON cultural_news FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );
