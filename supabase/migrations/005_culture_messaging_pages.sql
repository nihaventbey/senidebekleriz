-- Kültür odaklı platform mesajı: Hakkımızda, Misyon, Vizyon sayfaları

INSERT INTO pages (slug, title, content, meta_title, meta_description, is_published)
VALUES
  (
    'hakkimizda',
    'Hakkımızda',
    '<p><strong>Seni de Bekleriz</strong>, Türkiye''nin 81 ilindeki müzeleri, tarihi yerleri, sanat mekanlarını ve kültürel durakları bir araya getiren bir keşif platformudur.</p><p>Yeme-içme veya restoran rehberliği yapmıyoruz. Odağımız; insanların sanat ve tarihe yönelmesini kolaylaştırmak, bu mekanların daha görünür ve erişilebilir olmasını sağlamaktır.</p><p>Her şehir için editöryal içerikler, gezi rehberleri ve özenle seçilmiş mekan profilleri sunuyoruz. Amacımız, ziyaretçilere yalnızca liste değil; anlamlı ve güvenilir bir kültür rehberi sunmaktır.</p><p>Platformumuzda Google AdSense reklamları bulunabilir. Gelirler, içerik kalitesini artırmak ve yeni şehir rehberleri üretmek için kullanılmaktadır.</p><p>Daha fazla bilgi için <a href="/sayfa/misyon">Misyonumuz</a> ve <a href="/sayfa/vizyon">Vizyonumuz</a> sayfalarına göz atabilirsiniz.</p>',
    'Hakkımızda | Seni de Bekleriz',
    'Seni de Bekleriz, Türkiye''nin sanat, tarih, kültür ve müze odaklı keşif platformudur.',
    TRUE
  ),
  (
    'misyon',
    'Misyonumuz',
    '<p>Misyonumuz, Türkiye''deki sanat, tarih, kültür ve müze odaklı mekanları daha belirgin hale getirmek ve insanları bu alanlara yönlendirmektir.</p><h2>Ne yapıyoruz?</h2><ul><li>81 ilde müzeleri, tarihi yerleri, sanat mekanlarını ve parkları derliyoruz.</li><li>Her mekan için editöryal açıklamalar ve pratik gezi bilgileri sunuyoruz.</li><li>Şehir rehberleri ve blog yazılarıyla kültürel keşfi destekliyoruz.</li><li>Yeme-içme odaklı içerikleri platformumuzda öne çıkarmıyoruz.</li></ul><h2>Neden?</h2><p>Türkiye''nin zengin kültürel mirası, çoğu zaman gündelik tüketim rehberlerinin gölgesinde kalıyor. Biz, ziyaretçilerin antik kentlerden çağdaş sanat galerilerine kadar uzanan bu birikimi kolayca keşfetmesini istiyoruz.</p><p><a href="/sayfa/vizyon">Vizyonumuz</a> · <a href="/sayfa/hakkimizda">Hakkımızda</a></p>',
    'Misyonumuz | Seni de Bekleriz',
    'Seni de Bekleriz''in misyonu: Türkiye''nin sanat, tarih ve kültür mekanlarını görünür kılmak.',
    TRUE
  ),
  (
    'vizyon',
    'Vizyonumuz',
    '<p>Vizyonumuz, Türkiye''de sanat ve tarihe yönelen, kültürel mekanları kolayca keşfeden bir topluluk oluşturmaya katkı sağlamaktır.</p><h2>Hedefimiz</h2><ul><li>Her ilde kültürel durakların dijital haritasını oluşturmak.</li><li>Ziyaretçilere güvenilir, özgün ve güncel bir rehber sunmak.</li><li>Sanat ve tarihin günlük hayatta daha görünür olmasına yardımcı olmak.</li><li>Okul, aile ve bireysel geziler için ilham verici içerikler üretmek.</li></ul><h2>Nereye gidiyoruz?</h2><p>Uzun vadede Seni de Bekleriz''i, Türkiye''nin kültür ve miras keşfi için başvurulan bir referans platform haline getirmek istiyoruz. Restoran listeleri değil; müzeler, anıtlar, antik kentler ve sanat mekanları önceliğimizdir.</p><p><a href="/sayfa/misyon">Misyonumuz</a> · <a href="/sayfa/hakkimizda">Hakkımızda</a></p>',
    'Vizyonumuz | Seni de Bekleriz',
    'Seni de Bekleriz''in vizyonu: Sanat ve tarihe ilgiyi artıran güvenilir bir kültür rehberi olmak.',
    TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();
