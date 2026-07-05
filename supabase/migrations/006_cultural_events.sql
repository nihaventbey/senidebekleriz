-- Kültür etkinlikleri ve RSS kaynakları

CREATE TABLE IF NOT EXISTS event_feed_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'rss',
  feed_url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  sync_interval_hours INTEGER DEFAULT 6,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultural_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'duyuru'
    CHECK (event_type IN ('tiyatro', 'konser', 'sergi', 'festival', 'duyuru', 'diger')),
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'published', 'rejected', 'expired')),
  source_name TEXT,
  source_url TEXT,
  ticket_url TEXT,
  city_slug TEXT,
  venue_name TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  cover_image TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  raw_payload JSONB,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cultural_events_source_url
  ON cultural_events(source_url)
  WHERE source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cultural_events_slug ON cultural_events(slug);
CREATE INDEX IF NOT EXISTS idx_cultural_events_status ON cultural_events(status);
CREATE INDEX IF NOT EXISTS idx_cultural_events_published ON cultural_events(status, published_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_cultural_events_city ON cultural_events(city_slug)
  WHERE city_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cultural_events_starts ON cultural_events(starts_at)
  WHERE starts_at IS NOT NULL;

ALTER TABLE event_feed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read published events" ON cultural_events;
CREATE POLICY "Allow public read published events"
  ON cultural_events FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND (expires_at IS NULL OR expires_at > NOW())
  );

DROP POLICY IF EXISTS "Admin full access cultural events" ON cultural_events;
CREATE POLICY "Admin full access cultural events"
  ON cultural_events FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin full access event feed sources" ON event_feed_sources;
CREATE POLICY "Admin full access event feed sources"
  ON event_feed_sources FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

INSERT INTO event_feed_sources (name, source_type, feed_url, is_active, sync_interval_hours)
VALUES
  (
    'Kültür Bakanlığı — Haberler/Duyurular',
    'rss',
    'http://www.kultur.gov.tr/rss?Tip=2&Anah=1',
    TRUE,
    6
  ),
  (
    'Kültür Bakanlığı — Bakanlık Gündemi',
    'rss',
    'http://www.kultur.gov.tr/rss?Tip=2&Anah=89',
    TRUE,
    6
  )
ON CONFLICT (feed_url) DO NOTHING;
