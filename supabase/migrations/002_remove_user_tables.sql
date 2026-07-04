-- Remove user personalization tables (not part of product scope)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP TABLE IF EXISTS profiles CASCADE;

DROP POLICY IF EXISTS "Users can read own saved places" ON saved_places;
DROP POLICY IF EXISTS "Users can insert own saved places" ON saved_places;
DROP POLICY IF EXISTS "Users can delete own saved places" ON saved_places;
DROP TABLE IF EXISTS saved_places CASCADE;

DROP POLICY IF EXISTS "Users can manage own list places" ON list_places;
DROP TABLE IF EXISTS list_places CASCADE;

DROP POLICY IF EXISTS "Users can read own lists" ON user_lists;
DROP POLICY IF EXISTS "Users can insert own lists" ON user_lists;
DROP POLICY IF EXISTS "Users can update own lists" ON user_lists;
DROP POLICY IF EXISTS "Users can delete own lists" ON user_lists;
DROP TABLE IF EXISTS user_lists CASCADE;

DROP POLICY IF EXISTS "Users can read own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP TABLE IF EXISTS reviews CASCADE;

CREATE INDEX IF NOT EXISTS idx_places_is_featured ON places(is_featured) WHERE is_featured = TRUE;
