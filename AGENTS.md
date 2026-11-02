<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🏛️ Seni de Bekleriz — Kültür, Sanat ve Etkinlik Portalı
## Proje Manifestosu, Mimari İlkeleri ve Geliştirici Kılavuzu

### 1. Temel Misyon ve Konsept
"Seni de Bekleriz", Türkiye'nin **güncel kültür & sanat haberleri**, **canlı etkinlik ajandası** (tiyatro, konser, sergi, festival) ve **derinlemesine kültür-gezi rehberleri** sunan modern bir dijital kültür medyasıdır.

### 2. Kapsam Dışı Bırakılan & Emekliye Ayrılan Modüller (ÖNEMLİ!)
- **Rastgele OSM Mekan Çöplüğü Terk Edildi:** 7.000+ çiğköfteci, tavukçu, kafe ve açıklamasız OpenStreetMap (OSM) mekan katalogları terk edilmiştir. Bu mekanları zenginleştirmek veya indeksletmek için zaman harcanmaz.
- **Kategori Hub'ları (Restoranlar vb.):** Sitede restoran/kafe odaklı bir yapı yoktur; kültür-sanat dışı kategoriler devre dışıdır.
- **Körleme 301 Yönlendirmeleri Yasak:** Mevcut zengin içerikleri (`articles` tablosundaki 44 derinlemesine gezi/tarih rehberini) 404'e düşüren toptan yönlendirmeler yapılamaz.

### 3. Sitenin 5 Ana Çekirdek Sütunu
1. 📰 **Kültür & Sanat Haberleri (`/haberler`, `/haber/[slug]`):**
   - Arkeolojik keşifler, tarihi restorasyonlar, müze ve galeri açılışları, festival gelişmeleri, kültür politikaları ve sanat dünyası.
   - Tablo: `cultural_news`.
2. 🎭 **Etkinlik Takvimi & Şehir Ajandası (`/etkinlikler`, `/etkinlik/[slug]`, `/etkinlikler/[kategori]`):**
   - Gerçek başlangıç/bitiş tarihi (`starts_at`, `ends_at`), mekan adı, şehir ve bilet/kaynak linki olan konser, tiyatro, sergi, festival kayıtları.
   - **"Bu Hafta Sonu Ne Var?"** dinamik zaman filtresi.
   - **"Ücretsiz & Halka Açık Etkinlikler"** bülteni (AI tarayıcısıyla beslenen).
   - Tablo: `cultural_events`.
3. 🗺️ **Kültür Dosyaları & Şehir Rehberleri (`/blog`, `/blog/[slug]`):**
   - 44 adet yüksek kaliteli, özgün gezi, antik kent ve tarih rehberi ("İstanbul Tarihi Yarımada", "Troya", "Gordion", "Mardin Taş Konaklar").
   - Tablo: `articles`.
4. 📍 **81 İl Kültür Ajandası (`/sehir/[slug]`):**
   - Mekan listesi yerine; o ilin **yaklaşan etkinlikleri**, **kültür haberleri**, **varsa gezi rehberi** ve **Müzekart ile gezilebilecek öne çıkan tarihi yerleri**.
5. 🗺️🔥 **Dinamik Kültür Isı Haritası (Live Heatmap):**
   - Türkiye genelinde hangi ilde kaç aktif kültür etkinliği olduğunu canlı veritabanından gösteren interaktif SVG ısı haritası.

### 4. AI & Otomasyon Mimarisi
- Gemini AI (`gemini-3.5-flash`), Google News RSS ve kültür-sanat bültenlerini tarar.
- Toplu bültenlerden (`extract-multi-events.ts`) tek tek tarihli konser/tiyatro ayrıştırır.
- Ücretsiz etkinlikleri tespit edip etiketler (`is_free` / `price_type`).
- İlgisiz haberleri (asayiş, siyaset, magazin, spor) anında eler (`heuristicClassify`).

### 5. Frontend & Modern Web Guidance Kuralları
- **Mobil Öncelikli & Tam Responsive:** 320px mobil ekranlardan 4K geniş ekranlara kadar taşma yapmayan, fluid clamp tipografili ve container query'li kartlar.
- **Performans:** LCP adayı manşet görsellerinde `fetchpriority="high"`, diğerlerinde `aspect-ratio` rezerve edilerek Cumulative Layout Shift (CLS) sıfırlanmalıdır.
- **SEO & Temiz Yapı:** Yayındaki haberler, etkinlikler, blog yazıları ve 81 il ajandası Schema.org (`NewsArticle`, `Event`, `BreadcrumbList`) ile arama motorlarına eksiksiz açılmalıdır.
