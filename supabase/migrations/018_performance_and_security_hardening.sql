-- 018_performance_and_security_hardening.sql
-- Optimizes text search with trigram GIN indexes, adds composite indexes,
-- stores is_free as a generated column, secures ad_placements and sync_logs RLS,
-- and adds high-performance RPC function get_news_rails().

BEGIN;

-- 1. Enable pg_trgm extension for full-text / ILIKE similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN Trigram indexes on searchable text columns (resolves sequential scan bottleneck in /api/search)
CREATE INDEX IF NOT EXISTS idx_trgm_cities_name ON public.cities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_places_name ON public.places USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_articles_title ON public.articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_events_title ON public.cultural_events USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trgm_news_title ON public.cultural_news USING gin (title gin_trgm_ops);

-- 3. Composite performance indexes
CREATE INDEX IF NOT EXISTS idx_cultural_news_category_pub 
  ON public.cultural_news (category, published_at DESC) 
  WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_cultural_events_city_starts 
  ON public.cultural_events (city_slug, starts_at) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_cultural_events_upcoming 
  ON public.cultural_events (status, starts_at) 
  WHERE status = 'published';

-- 4. Store is_free as generated column on cultural_events for fast indexable filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'cultural_events' 
      AND column_name = 'is_free'
  ) THEN
    ALTER TABLE public.cultural_events
      ADD COLUMN is_free BOOLEAN GENERATED ALWAYS AS (
        COALESCE((raw_payload->>'is_free')::boolean, FALSE) OR
        COALESCE(raw_payload->>'price_type' = 'free', FALSE)
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cultural_events_is_free 
  ON public.cultural_events (is_free) 
  WHERE status = 'published';

-- 5. Helper function is_admin() (guaranteed to exist before RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = (SELECT auth.uid())
      AND raw_app_meta_data ->> 'role' = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 6. RLS policies for ad_placements and sync_logs (both had RLS enabled without explicit policies)
DROP POLICY IF EXISTS "Allow public read active ad placements" ON public.ad_placements;
CREATE POLICY "Allow public read active ad placements"
  ON public.ad_placements FOR SELECT TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full access ad placements" ON public.ad_placements;
CREATE POLICY "Admin full access ad placements"
  ON public.ad_placements FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access sync logs" ON public.sync_logs;
CREATE POLICY "Admin full access sync logs"
  ON public.sync_logs FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 7. RPC function for categorized news vitrine (NetflixNewsRails) without downloading full markdown content
CREATE OR REPLACE FUNCTION public.get_news_rails(limit_per_cat INT DEFAULT 8)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  summary TEXT,
  cover_image TEXT,
  city_slug TEXT,
  category TEXT,
  source_name TEXT,
  source_url TEXT,
  is_published BOOLEAN,
  is_featured BOOLEAN,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  WITH ranked AS (
    SELECT 
      n.id, n.title, n.slug, n.summary, n.cover_image, n.city_slug,
      n.category, n.source_name, n.source_url, n.is_published,
      n.is_featured, n.published_at, n.created_at, n.updated_at,
      ROW_NUMBER() OVER (
        PARTITION BY n.category 
        ORDER BY n.published_at DESC NULLS LAST, n.created_at DESC
      ) AS rn
    FROM public.cultural_news n
    WHERE n.is_published = TRUE
  )
  SELECT 
    id, title, slug, summary, cover_image, city_slug,
    category, source_name, source_url, is_published,
    is_featured, published_at, created_at, updated_at
  FROM ranked
  WHERE rn <= limit_per_cat;
$$;

REVOKE ALL ON FUNCTION public.get_news_rails(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_news_rails(INT) TO anon, authenticated;

COMMIT;
