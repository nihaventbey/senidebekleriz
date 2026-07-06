-- Reklam birimi formatı (fluid/auto) ve layout key
ALTER TABLE ad_placements
  ADD COLUMN IF NOT EXISTS ad_format TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS ad_layout_key TEXT;

-- Sitedeki AdBanner slot anahtarlarıyla hizalı varsayılan pozisyonlar
INSERT INTO ad_placements (name, position, is_active) VALUES
  ('Ana Sayfa — Hero Altı', 'home-hero-bottom', true),
  ('Ana Sayfa — Footer Üstü', 'home-footer-top', true),
  ('Şehirler — Üst', 'cities-top', true),
  ('Şehirler — Alt', 'cities-bottom', true),
  ('Şehir Detay — Üst', 'city-content-top', true),
  ('Şehir Detay — Liste Arası', 'city-list-inline', true),
  ('Kategoriler — Üst', 'categories-top', true),
  ('Kategoriler — Alt', 'categories-bottom', true),
  ('Kategori Detay — Üst', 'category-content-top', true),
  ('Kategori Detay — Liste Arası', 'category-list-inline', true),
  ('Mekan Detay — Üst', 'place-top', true),
  ('Mekan Detay — İçerik İçi', 'place-content-inline', true),
  ('Mekan Detay — Kenar Çubuğu', 'place-sidebar', true),
  ('Etkinlik Detay — Alt', 'event-detail-bottom', true)
ON CONFLICT (position) DO UPDATE SET
  name = EXCLUDED.name;
