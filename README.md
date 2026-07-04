# Seni de Bekleriz

Türkiye'nin 81 ilini ve kültür/tarih/sanat mekanlarını keşfetmeye yönelik Next.js tabanlı bir gezi rehberi. Herkese açık keşif sitesi + `/yonetim` altında admin CMS.

## Teknoloji

- Next.js 16 (App Router), React 19, TypeScript
- Supabase (PostgreSQL, Auth yalnızca admin paneli için)
- Tailwind CSS 4, shadcn/ui
- Leaflet haritalar

## Kurulum

```bash
npm install
cp .env.local.example .env.local
# .env.local dosyasını doldurun
```

### Veritabanı

Supabase projesinde SQL migration dosyalarını sırayla çalıştırın:

1. [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
2. [`supabase/migrations/002_remove_user_tables.sql`](supabase/migrations/002_remove_user_tables.sql) — mevcut veritabanında kullanıcı tabloları varsa
3. [`supabase/migrations/003_culture_focus.sql`](supabase/migrations/003_culture_focus.sql) — restoran kategorisini kaldırır, sanat mekanları ekler
4. [`supabase/migrations/004_articles.sql`](supabase/migrations/004_articles.sql) — Markdown blog yazıları tablosu

Ardından seed:

```bash
npm run seed
```

### Geliştirme

```bash
npm run dev
```

Site: [http://localhost:3000](http://localhost:3000)  
Admin: [http://localhost:3000/yonetim/giris](http://localhost:3000/yonetim/giris)

## Veri scriptleri

| Komut | Açıklama |
|-------|----------|
| `npm run seed` | 81 şehir, kategoriler, reklam slotları, admin kullanıcı |
| `npm run fetch-places [şehir\|all]` | OSM/Overpass ile mekan importu |
| `npm run fetch:istanbul` | İstanbul özel import |
| `npm run enrich` | Wikipedia açıklama zenginleştirmesi |
| `npm run check:supabase` | Supabase bağlantı kontrolü |
| `npm run build:deploy` | Standalone FTP deploy paketi (`deploy/`) |

Tüm iller için mekan verisi:

```bash
npm run fetch-places all
npm run enrich
```

## Test

```bash
npm test
```

## Ürün kapsamı

- Herkese açık şehir, mekan, kategori keşfi (tarih, müze, sanat, park)
- Markdown blog / gezi rehberi (`/blog`) + admin AI taslak desteği
- Admin CMS: şehir, mekan, kategori, sayfa ve reklam yönetimi
- Kişiselleştirme veya halka açık kullanıcı hesabı **yok**

## Deploy

```bash
npm run build:deploy
```

Çıktı `deploy/` klasöründe standalone build olarak oluşur.
