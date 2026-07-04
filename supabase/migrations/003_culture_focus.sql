-- Kültür/tarih/sanat odağı: restoran kategorisini kaldır, sanat mekanları ekle

INSERT INTO categories (name, slug, icon, color, is_active)
VALUES ('Sanat Mekanları', 'sanat-mekanlari', 'Palette', '#EC4899', true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    is_active = true;

-- Restoran kategorisi bağlantılarını kaldır
DELETE FROM place_categories
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'restoranlar');

-- Kategorisi kalmayan OSM mekanlarını pasifleştir (çoğunlukla restoran/cafe)
UPDATE places
SET is_active = false,
    updated_at = NOW()
WHERE source = 'osm'
  AND id NOT IN (SELECT DISTINCT place_id FROM place_categories);

-- Restoran kategorisini devre dışı bırak
UPDATE categories
SET is_active = false
WHERE slug = 'restoranlar';
