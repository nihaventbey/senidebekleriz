-- 008 migration deadlock olursa: her bloğu SQL Editor'de AYRI AYRI çalıştırın.
-- Önce dev server ve cron'u durdurun.

-- === ADIM 1: Tablolar ===
CREATE TABLE IF NOT EXISTS discovery_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'google_news_rss',
  query_or_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_type, query_or_url)
);

CREATE TABLE IF NOT EXISTS discovered_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_name TEXT,
  snippet TEXT,
  content_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (content_type IN ('event', 'article', 'unknown', 'skip')),
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'imported', 'rejected')),
  target_table TEXT,
  target_id UUID,
  cover_image TEXT,
  city_slug TEXT,
  published_at_source TIMESTAMPTZ,
  raw_payload JSONB,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === ADIM 2: İndeksler ===
CREATE INDEX IF NOT EXISTS idx_discovered_content_status
  ON discovered_content(status, discovered_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovered_content_type
  ON discovered_content(content_type)
  WHERE status = 'pending_review';

-- === ADIM 3: RLS ===
ALTER TABLE discovery_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_content ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'discovery_sources'
      AND policyname = 'Admin full access discovery sources'
  ) THEN
    CREATE POLICY "Admin full access discovery sources"
      ON discovery_sources FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'discovered_content'
      AND policyname = 'Admin full access discovered content'
  ) THEN
    CREATE POLICY "Admin full access discovered content"
      ON discovered_content FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- === ADIM 4: Seed ===
INSERT INTO discovery_sources (name, source_type, query_or_url, is_active)
VALUES
  ('Google Haberler — Kültür Sanat', 'google_news_rss', 'kültür sanat Türkiye', TRUE),
  ('Google Haberler — Müze Sergi', 'google_news_rss', 'müze sergi Türkiye', TRUE),
  ('Google Haberler — Tiyatro Konser', 'google_news_rss', 'tiyatro konser Türkiye', TRUE),
  ('Google Haberler — Kültür Etkinlik', 'google_news_rss', 'kültür etkinlik Türkiye', TRUE),
  ('Google Haberler — Gezi Kültür', 'google_news_rss', 'gezi kültür tarih Türkiye', TRUE)
ON CONFLICT (source_type, query_or_url) DO NOTHING;

-- === Doğrulama ===
SELECT COUNT(*) AS discovery_source_count FROM discovery_sources;
SELECT COUNT(*) AS discovered_content_count FROM discovered_content;
