-- Apply before deploying the app_metadata-only authorization code.
-- Deliberately NEVER promote users based on editable raw_user_meta_data.
BEGIN;

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

DROP POLICY IF EXISTS "Admin full access cities" ON public.cities;
CREATE POLICY "Admin full access cities" ON public.cities
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access categories" ON public.categories;
CREATE POLICY "Admin full access categories" ON public.categories
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access places" ON public.places;
CREATE POLICY "Admin full access places" ON public.places
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access pages" ON public.pages;
CREATE POLICY "Admin full access pages" ON public.pages
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access articles" ON public.articles;
CREATE POLICY "Admin full access articles" ON public.articles
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access cultural events" ON public.cultural_events;
CREATE POLICY "Admin full access cultural events" ON public.cultural_events
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access event feed sources" ON public.event_feed_sources;
CREATE POLICY "Admin full access event feed sources" ON public.event_feed_sources
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access discovery sources" ON public.discovery_sources;
CREATE POLICY "Admin full access discovery sources" ON public.discovery_sources
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access discovered content" ON public.discovered_content;
CREATE POLICY "Admin full access discovered content" ON public.discovered_content
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin full access cultural news" ON public.cultural_news;
CREATE POLICY "Admin full access cultural news" ON public.cultural_news
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

COMMIT;
