const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const richCityGuides = [
  {
    title: "İstanbul Gezi Rehberi: Tarihi Yarımada'dan Boğaziçi'ne 3 Günlük Eksiksiz Şehir Turu",
    slug: "istanbul-gezi-rehberi-tarihi-yarimada-bogazici-3-gunluk-rota",
    city_slug: "istanbul",
    cover_image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Üç imparatorluğun başkenti İstanbul'u adım adım keşfedin. Tarihi Yarımada, Boğaz hattı, meşhur lezzet durakları, Müze Kart ipuçları ve 3 günlük ideal rota.",
    meta_title: "İstanbul Gezi Rehberi: 3 Günlük Rota, Müzeler ve Lezzet Durakları",
    meta_description: "İstanbul'da gezilecek yerler, Tarihi Yarımada rotası, Boğaz turu, nerede ne yenir ve pratik ulaşım ipuçları içeren kapsamlı İstanbul gezi rehberi.",
    content: `# İstanbul Gezi Rehberi: Tarihi Yarımada'dan Boğaziçi'ne 3 Günlük Eksiksiz Şehir Turu

Asya ile Avrupa'nın kesişim noktasında, iki denizin kucaklaştığı İstanbul; Roma, Bizans ve Osmanlı medeniyetlerinin mirasını aynı sokaklarda yaşatan dünyanın en büyüleyici metropollerinden biridir. Bu rehber; kenti ilk kez ziyaret edenlerden şehri derinlemesine keşfetmek isteyenlere kadar, adım adım planlanmış bir rota, gastronomi durakları ve pratik seyahat tüyoları sunmaktadır.

---

## 1. İstanbul'a Genel Bakış ve En İyi Ziyaret Zamanı

İstanbul her mevsim ayrı bir ruha bürünür. Şehri yürüyerek keşfetmek ve açık hava mekanlarının tadını çıkarmak için en ideal dönemler **Nisan - Haziran** (İlkbahar) ve **Eylül - Kasım** (Sonbahar) aylarıdır. Nisan ayında parkları süsleyen Lale Festivali, Ekim ayında ise Boğaz kıyısındaki sarı sonbahar yaprakları şehre masalsı bir atmosfer katar.

---

## 2. 3 Günlük İdeal İstanbul Şehir Turu Rotası

### 1. Gün: Tarihi Yarımada ve İmparatorluklar Mirası
* **09:00 - Ayasofya-i Kebîr Câmi-i Şerîfi ve Sultanahmet Meydanı:** Güne 1500 yıllık mimarlık mucizesi Ayasofya ile başlayın. Meydandaki Dikilitaş ve Yılanlı Sütun'u inceleyin.
* **11:00 - Topkapı Sarayı ve Kutsal Emanetler:** Osmanlı padişahlarının 4 asır boyunca devleti yönettiği saray avlularını, Harem dairesini ve Hazine dairesini gezin.
* **14:00 - Yerebatan Sarnıcı:** Suyun içinden yükselen 336 mermer sütun ve gizemli Medusa başlarını keşfedin.
* **16:00 - Kapalıçarşı ve Mahmutpaşa:** 4000 dükkanlı tarihi çarşının labirent gibi sokaklarında kaybolun, Nuruosmaniye kapısından çıkıp otantik kahvecilerde mola verin.
* **18:30 - Süleymaniye Camii ve Gün Batımı:** Mimar Sinan'ın kalfalık eseri Süleymaniye'nin avlusundan Haliç ve Boğaz silüetine karşı gün batımını izleyin.

### 2. Gün: Galata, Beyoğlu ve Boğaziçi Hattı
* **09:30 - Karaköy ve Galata Kulesi:** Cenevizlilerden kalan tarihi kuleye çıkıp 360 derece İstanbul panoramasını fotoğraflayın.
* **11:30 - İstiklal Caddesi ve Çiçek Pasajı:** Tarihi tramvayın çıngırak sesleri eşliğinde Saint Antuan Kilisesi, Pera Müzesi ve tarihi pasajları gezin.
* **14:30 - Dolmabahçe Sarayı:** Osmanlı'nın 19. yüzyıl batılılaşma döneminin en görkemli sarayında kristal merdivenleri ve Muayede Salonu'nu ziyaret edin.
* **17:00 - Ortaköy Meydanı ve Boğaz Turu:** Ortaköy Camii önünde meşhur kumpir/waffle molası verin ve meydandan kalkan 1 saatlik Boğaz turu teknesine binin.

### 3. Gün: Kadıköy, Moda ve Üsküdar (Anadolu Yakası)
* **10:00 - Vapurla Kadıköy'e Geçiş:** Eminönü veya Karaköy'den vapura binip martılara simit atarak kıta değiştirin.
* **11:30 - Tarihi Kadıköy Çarşısı ve Moda Sahili:** Bahariye Caddesi, Süreyya Operası ve Moda burnunda yürüyüş yapın; Barış Manço Müze Evi'ni görün.
* **15:00 - Kuzguncuk ve Beylerbeyi:** Rengarenk tarihi ahşap cumbalı evleri, bostanı ve samimi kafe kültürüyle Kuzguncuk sokaklarını adımlayın.
* **18:30 - Salacak Sahili ve Kız Kulesi:** Güneş Tarihi Yarımada silüeti ardında batarken Kız Kulesi manzarasına karşı çayınızı yudumlayın.

---

## 3. İstanbul'da Ne Yenir? Meşhur Gastronomi Durakları

* **Tarihi Sultanahmet Köftecisi (1920):** İncecik kıvamlı hakiki ızgara köfte ve yanında piyaz.
* **Eminönü Balık-Ekmek & Turşu Suyu:** Tarihi teknelerin yanında taze uskumru ve acılı turşu suyu.
* **Vefa Bozacısı (1876):** Tarihi ahşap dükkanda üzerine sarı leblebi ve tarçın dökülmüş geleneksel boza.
* **Karaköy Güllüoğlu:** Çıtır çıtır taze fıstıklı baklava ve kaymaklı şöbiyet.
* **Kanlıca Yoğurdu:** Üzerine pudra şekeri serpilerek yenen meşhur Kanlıca İskelesi yoğurdu.

---

## 4. Pratik Seyahat İpuçları, Ulaşım & Müze Kart

* **İstanbulkart:** Metro, metrobüs, tramvay, vapur ve füniküler hatlarının tamamında geçerlidir. Havalimanından ve istasyon otomatlarından kolayca temin edilebilir.
* **Müze Kart:** Topkapı Sarayı, Galata Kulesi, İstanbul Arkeoloji Müzeleri, Türk ve İslam Eserleri Müzesi gibi Kültür Bakanlığı'na bağlı tüm mekanlarda sıra beklemeden geçerlidir; seyahatinizden önce mutlaka edinin.
* **Yürüyüş ve Ayakkabı Seçimi:** Tarihi Yarımada ve Beyoğlu yokuşlu ve Arnavut kaldırımlıdır; rahat yürüyüş ayakkabıları tercih edin.
* **Cami Ziyaretleri Adabı:** Aktif ibadethaneler olan camilere girerken omuz ve dizlerin örtülü olması, başörtüsü kurallarına dikkat edilmesi gerekmektedir.`
  },
  {
    title: "Çanakkale Gezi Rehberi: Gelibolu Şehitlikleri, Troya Efsanesi ve 2 Günlük Tarih Rotası",
    slug: "canakkale-gezi-rehberi-gelibolu-troya-aynali-carsi-rotasi",
    city_slug: "canakkale",
    cover_image: "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Tarihin yazıldığı Çanakkale'yi keşfedin. Gelibolu Tarihi Alanı, Şehitler Abidesi, Troya Müzesi, Aynalı Çarşı, Bozcaada tüyoları ve enfes peynir helvası durakları.",
    meta_title: "Çanakkale Gezi Rehberi: Gelibolu Şehitlikleri, Troya ve 2 Günlük Rota",
    meta_description: "Çanakkale'de gezilecek yerler, Gelibolu Yarımadası şehitlik turu, Troya Antik Kenti ve Müzesi, Aynalı Çarşı ve gastronomi durakları içeren rehber.",
    content: `# Çanakkale Gezi Rehberi: Gelibolu Şehitlikleri, Troya Efsanesi ve 2 Günlük Tarih Rotası

Çanakkale; boğazın serin sularında bir milletin küllerinden yeniden doğduğu, Homeros'un İlyada Destanı ile efsanelerin gerçeğe dönüştüğü ve iki kıtayı birbirine bağlayan abidevi bir şehirdir. Hem hüzün dolu kahramanlık destanlarına tanıklık etmek hem de Ege'nin zeytin kokulu rüzgarlarını hissetmek isteyenler için bu kapsamlı rehberi hazırladık.

---

## 1. Çanakkale'ye Genel Bakış ve En İyi Ziyaret Zamanı

Çanakkale'yi gezmek için en uygun dönemler **Nisan - Mayıs** (İlkbahar anma törenleri dönemi) ve **Eylül - Ekim** (Sonbahar) aylarıdır. Yaz aylarında Bozcaada ve Assos kıyıları deniz turizmi için idealken, Gelibolu Tarihi Alanı'nı yürüyerek ve duygulanarak gezmek için ılık ilkbahar günleri mükemmeldir.

---

## 2. 2 Günlük İdeal Çanakkale Gezi Rotası

### 1. Gün: Gelibolu Tarihi Alanı ve Şehitlikler
* **09:00 - Kilitbahir Kalesi ve Namazgâh Tabyası:** Fatih Sultan Mehmed'in boğazı korumak için 'Denizin Kilidi' şeklinde yaptırdığı kaleyi ve tabyaları görün.
* **10:30 - Seyit Onbaşı Anıtı (Rumeli Mecidiye Tabyası):** 215 kiloluk top mermisini kaldırarak Ocean zırhlısını batıran Seyit Onbaşı'nın kahramanlık meydanında saygı duruşunda bulunun.
* **12:00 - Çanakkale Şehitler Abidesi ve Morto Koyu:** 41 metre yüksekliğindeki anıtın altında vatan savunmasında can veren Mehmetçiklerin aziz hatırasını yad edin.
* **14:30 - Seddülbahir Kalesi ve Yahya Çavuş Şehitliği:** Ertuğrul Koyu'na çıkarma yapan düşman birliklerine karşı 67 askeriyle destan yazan Yahya Çavuş'un anıtını gezin.
* **16:30 - 57. Piyade Alayı Şehitliği ve Conkbayırı:** Mustafa Kemal'in "Size taarruzu değil, ölmeyi emrediyorum" dediği ve saatinin şarapnel parçasını durdurduğu tarihi tepeyi ziyaret edin.

### 2. Gün: Şehir Merkezi, Troya Antik Kenti ve Müzesi
* **09:30 - Çanakkale Kordonu ve Truva Atı:** Filmde kullanılan dev tahta atın önünde fotoğraf çekilin, boğaz havası alın.
* **11:00 - Aynalı Çarşı ve Saat Kulesi:** Meşhur türküye konu olan tarihi Aynalı Çarşı'yı gezin, yerel seramik ve hediyelikler inceleyin.
* **13:30 - Troya Müzesi (Avrupa Yılın Müzesi Ödüllü):** Tevfikiye köyünde yer alan, modern mimarisi ve interaktif sergileriyle antik çağ hazinelerini sunan dünya çapındaki müzeyi gezin.
* **15:30 - Troya Antik Kenti Ören Yeri:** 9 farklı medeniyet katmanını, Athena Tapınağı kalıntılarını ve efsanevi surları yerinde adımlayın.
* **18:00 - Kordonda Gün Batımı ve Deniz Ürünleri:** Çanakkale Boğazı'nda gemilerin geçişini izleyerek taze Ege balıklarıyla günü tamamlayın.

---

## 3. Çanakkale'de Ne Yenir? Meşhur Gastronomi Durakları

* **Fırınlanmış Peynir Helvası:** Çanakkale merkezde Kadir Yaşar veya Babalık'ta fırından yeni çıkmış sıcak peynir helvası (isteğe göre dondurmalı).
* **Biga Köftesi:** Biga ilçesinin doğal otlaklarında beslenen dana etinden hazırlanan meşhur sulu ızgara köfte.
* **Sardalya Izgara & Asma Yaprağında Sardalya:** Gelibolu ve Çanakkale boğazının en lezzetli balığı olan taze sardalya.
* **Ezine Peyniri:** Kazdağları eteklerindeki kekik kokulu sütlerden üretilen tescilli tam yağlı beyaz peynir.

---

## 4. Pratik Ulaşım ve Seyahat İpuçları

* **Gelibolu Ulaşımı:** Çanakkale merkezden Kilitbahir veya Eceabat'a feribotla 15-20 dakikada geçebilirsiniz. 1915 Çanakkale Köprüsü üzerinden de araçla hızlı geçiş mümkündür.
* **Rehberli Tur Tavsiyesi:** Gelibolu Tarihi Alanı'nı gezerken tarihi olayların derinliğini hissetmek için alan kılavuzu veya sesli rehber cihazı kiralamanız tavsiye edilir.
* **Müze Kart:** Troya Müzesi, Troya Ören Yeri ve Çanakkale Kalesi'nde geçerlidir.`
  },
  {
    title: "İzmir Gezi Rehberi: Kordon'dan Efes'e, Tarihi Kemeraltı ve 2 Günlük Ege Rotası",
    slug: "izmir-gezi-rehberi-kordon-kemeralti-efes-sirince-rotasi",
    city_slug: "izmir",
    cover_image: "https://images.unsplash.com/photo-1594973809632-15933a3ef561?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Ege'nin incisi İzmir'i keşfedin. Tarihi Saat Kulesi, Kemeraltı Çarşısı, Efes Antik Kenti, Şirince Köyü, boyoz ve kumru durakları içeren dolu dolu rehber.",
    meta_title: "İzmir Gezi Rehberi: Kemeraltı, Efes, Kordon ve 2 Günlük Rota",
    meta_description: "İzmir'de gezilecek yerler, Konak Meydanı, Saat Kulesi, Tarihi Kemeraltı Çarşısı, Efes Antik Kenti ve Şirince turu içeren kapsamlı seyahat rehberi.",
    content: `# İzmir Gezi Rehberi: Kordon'dan Efes'e, Tarihi Kemeraltı ve 2 Günlük Ege Rotası

Ege'nin incisi, palmiyeleri, imbat rüzgarı ve asırlık hoşgörü kültürüyle İzmir; antik dönemin Smyrna'sından modern Cumhuriyet kentine uzanan eşsiz bir mirasa sahiptir. Bu rehber; kentin kalbi Konak ve Alsancak sokaklarından, UNESCO Dünya Mirası Efes Antik Kenti'ne uzanan keyifli bir gezi planı sunmaktadır.

---

## 1. İzmir'e Genel Bakış ve En İyi Ziyaret Zamanı

Akdeniz ikliminin hakim olduğu İzmir'i ziyaret etmek için en ideal zaman **Nisan - Mayıs** ve **Eylül - Ekim** aylarıdır. Yaz aylarında sıcaklıklar yüksek seyrederken ilkbahar ve sonbahar günlerinde Kordon boyunca yürümek, Kemeraltı'nda fincanda pişen dibek kahvesi içmek ve antik kentleri gezmek son derece keyiflidir.

---

## 2. 2 Günlük İdeal İzmir Gezi Rotası

### 1. Gün: Tarihi İzmir, Konak ve Kordon
* **09:00 - Konak Meydanı ve Tarihi Saat Kulesi:** 1901 yapımı kentin simgesi Saat Kulesi ve Yalı Camii önünde güvercinleri besleyerek güne başlayın.
* **10:00 - Tarihi Kemeraltı Çarşısı ve Kızlarağası Hanı:** Dünyanın en büyük açık hava çarşılarından Kemeraltı'nda baharatçılar, antikacılar ve hanları keşfedin; Kızlarağası Hanı avlusunda kumda kahve için.
* **13:00 - Agora Ören Yeri:** Roma döneminin bazilikası, su kanalları ve sütunlu caddeleriyle şehir merkezindeki antik mirası görün.
* **15:00 - Tarihi Asansör ve Dario Moreno Sokağı:** Mithatpaşa ile Halilrıfatpaşa caddelerini bağlayan 1907 yapımı asansörle tepeye çıkıp İzmir Körfezi manzarasını seyredin.
* **18:00 - Kordon Boyu ve Alsancak Gün Batımı:** Kordon'un çimlerine oturup gün batımını izleyin, Kıbrıs Şehitleri Caddesi'nin kafelerini keşfedin.

### 2. Gün: Selçuk, Efes Antik Kenti ve Şirince
* **09:30 - Efes Antik Kenti:** Celsus Kütüphanesi, 25 bin kişilik Büyük Tiyatro, Yamaç Evler ve Kuretler Caddesi'ni adımlayın.
* **13:00 - Meryem Ana Evi ve Saint Jean Bazilikası:** Bülbüldağı eteklerinde Hristiyan alemi için kutsal kabul edilen Meryem Ana Evi'ni ziyaret edin.
* **15:00 - Şirince Köyü:** Zeytinlikler ve şeftali bahçeleri arasındaki tarihi Rum evlerini, Arnavut kaldırımlı sokakları ve meyve sularını deneyimleyin.
* **18:00 - Kuşadası / Pamucak Sahili:** Ege Denizi kıyısında taze deniz ürünleri ve zeytinyağlı mezelerle günü sonlandırın.

---

## 3. İzmir'de Ne Yenir? Meşhur Gastronomi Durakları

* **İzmir Boyozu & Fırında Haşlanmış Yumurta:** Alsancak Dostlar Fırını'nda fırından yeni çıkmış çıtır sade veya ıspanaklı boyoz.
* **İzmir Kumrusu:** Çeşme usulü nohut mayalı ekmekte ızgara sucuk, salam ve eritilmiş tulum peynirli sıcak sandviç.
* **Tarihi Kemeraltı Söğüşü:** Kelle eti, yanak, dil, bol maydanoz, soğan ve kimyonlu lavaş dürüm.
* **İzmir Şambalisi:** Kemeraltı Meşhur Şambalicisi'nde üzeri bademli, şerbetli ve arasına kaymak konulan tarihi tatlı.
* **Lokma Tatlısı:** Çıtır çıtır kızarmış, tarçınlı geleneksel şerbetli Ege lokması.

---

## 4. Pratik Ulaşım ve Seyahat İpuçları

* **İzmirim Kart:** Tramvay, vapur, İZBAN banliyö treni ve metro hatlarında geçerlidir. Havalimanından İZBAN ile doğrudan Alsancak ve Selçuk'a (Efes) ulaşabilirsiniz.
* **Müze Kart:** Efes Antik Kenti, Agora, Efes Müzesi ve Tarihi Asansör bölgesindeki kültür mekanlarında geçerlidir.`
  },
  {
    title: "Nevşehir & Kapadokya Gezi Rehberi: Balon Turu, Göreme, Vadiler ve Yeraltı Şehirleri",
    slug: "nevsehir-kapadokya-gezi-rehberi-balon-turu-goreme-yeralti-sehri",
    city_slug: "nevsehir",
    cover_image: "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Güzel Atlar Ülkesi Kapadokya'yı keşfedin. Sıcak hava balonları, Göreme Açık Hava Müzesi, Derinkuyu Yeraltı Şehri, vadiler ve testi kebabı durakları.",
    meta_title: "Kapadokya Gezi Rehberi: Balon Turu, Vadiler ve 2 Günlük Rota",
    meta_description: "Kapadokya ve Nevşehir'de gezilecek yerler, Göreme, Uçhisar Kalesi, Derinkuyu Yeraltı Şehri, balon turu ve vadi yürüyüşleri içeren eksiksiz rehber.",
    content: `# Nevşehir & Kapadokya Gezi Rehberi: Balon Turu, Göreme, Vadiler ve Yeraltı Şehirleri

Milyonlarca yıl önce Erciyes ve Hasandağı'nın püskürttüğü lavların rüzgar ve yağmurla aşınması sonucu oluşan Kapadokya; peri bacaları, kayalara oyulmuş manastırları ve yerin metrelerce altına uzanan gizemli yeraltı şehirleriyle masalsı bir coğrafyadır.

---

## 1. Kapadokya'ya Genel Bakış ve En İyi Ziyaret Zamanı

Kapadokya'nın büyüsünü yaşamak için **Eylül - Ekim** (Bağ bozumu ve ılık havalar) ile **Nisan - Mayıs** ayları en ideal dönemlerdir. Kış aylarında karlar altındaki peribacaları olağanüstü fotojenik manzaralar sunarken, sıcak hava balonları yılın yaklaşık 250 günü hava koşulları uygun olduğunda havalanmaktadır.

---

## 2. 2 Günlük İdeal Kapadokya Gezi Rotası

### 1. Gün: Göreme, Uçhisar ve Vadiler (Kırmızı Tur Hattı)
* **05:30 - Sıcak Hava Balon Turu & Gün Doğumu Seyri:** Sabahın ilk ışıklarında yüzlerce balonun arasından peribacalarını gökyüzünden izleyin veya Aşk Vadisi sırtlarından balonları fotoğraflayın.
* **09:30 - Göreme Açık Hava Müzesi (UNESCO):** 4. yüzyıldan kalan kaya kiliseleri, Karanlık Kilise ve Tokalı Kilise'deki canlı İncil fresklerini keşfedin.
* **12:00 - Paşabağları (Rahipler Vadisi) ve Zelve Ören Yeri:** Üç başlı dev peribacalarını ve kayalara oyulmuş tarihi yerleşimi gezin.
* **15:00 - Avanos Çömlek Atölyeleri:** Kızılırmak'ın kırmızı çamuruyla dönen çarkın başına geçip kendi çömleğinizi yapmayı deneyin.
* **18:00 - Uçhisar Kalesi ve Gün Batımı:** Bölgenin en yüksek noktası olan kaleye tırmanarak tüm Kapadokya vadilerine hakim gün batımını seyredin.

### 2. Gün: Yeraltı Şehirleri ve Ihlara Vadisi (Yeşil Tur Hattı)
* **09:30 - Derinkuyu veya Kaymaklı Yeraltı Şehri:** 8 kat yerin altına inen, havalandırma bacaları, kiliseleri ve devasa sürgü taşlarıyla binlerce insanın sığındığı mühendislik harikasını gezin.
* **12:30 - Ihlara Vadisi ve Melendiz Çayı:** 14 kilometrelik kanyon boyunca ağaçlar altında yürüyüş yapın, kaya kiliselerini görün ve nehir üzerindeki çardaklarda mola verin.
* **15:30 - Selime Manastırı:** Vadinin çıkışındaki devasa kaya katedralini ve keşiş odalarını keşfedin.
* **18:30 - Güvercinlik Vadisi (Ortahisar):** Kayalara oyulmuş güvercin yuvalarını ve nazar boncuklu dilek ağacını fotoğraflayın.

---

## 3. Kapadokya'da Ne Yenir? Meşhur Gastronomi Durakları

* **Geleneksel Testi Kebabı:** Toprak testi içine kuzu eti, arpacık soğan ve domates konularak fırınlanan, masanızda çekiçle testisi kırılarak servis edilen efsane lezzet.
* **Kapadokya Kuru Kaymağı:** Kaymaklı köyünde yapılan, gofret gibi kesilerek balla servis edilen kıtır kaymak.
* **Çömlekte Kuru Fasulye:** Avanos çömleklerinde kısık ateşte pişen tereyağlı etli kuru fasulye.
* **Nevşehir Mantısı & Kabak Çekirdeği:** Sütle kavrulmuş meşhur Nevşehir kabak çekirdeği.

---

## 4. Pratik Ulaşım ve Seyahat İpuçları

* **Balon Rezervasyonu:** Balon turları hava durumuna bağlıdır; rezervasyonunuzu seyahatinizin ilk gününe yaptırın ki iptal olursa sonraki günlere kaydırma şansınız olsun.
* **Yeraltı Şehirleri:** Klostrofobisi veya bel rahatsızlığı olanlar için dar tüneller zorlayıcı olabilir; rahat spor ayakkabı tercih edin.
* **Müze Kart:** Göreme Açık Hava Müzesi, Zelve, Derinkuyu, Kaymaklı ve Ihlara Vadisi'nde geçerlidir.`
  },
  {
    title: "Gaziantep Gezi Rehberi: Zeugma Mozaikleri, Bakırcılar Çarşısı ve UNESCO Gastronomi Rotası",
    slug: "gaziantep-gezi-rehberi-zeugma-bakircilar-carsisi-gastronomi-rotasi",
    city_slug: "gaziantep",
    cover_image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Güneydoğu'nun lezzet başkenti Gaziantep'i keşfedin. Zeugma Mozaik Müzesi, Çingene Kızı, Tarihi Bakırcılar Çarşısı, Beyran, Katmer ve fıstıklı baklava durakları.",
    meta_title: "Gaziantep Gezi Rehberi: Zeugma, Bakırcılar Çarşısı ve Gastronomi Turu",
    meta_description: "Gaziantep'te gezilecek yerler, Zeugma Mozaik Müzesi, Tarihi Tahmis Kahvesi, Bakırcılar Çarşısı ve UNESCO tescilli lezzet durakları içeren gezi rehberi.",
    content: `# Gaziantep Gezi Rehberi: Zeugma Mozaikleri, Bakırcılar Çarşısı ve UNESCO Gastronomi Rotası

İpek Yolu'nun kadim kavşağı, kahramanlık unvanlı Gaziantep; 6000 yıllık tarihi, dünyanın en zengin mozaik koleksiyonu ve UNESCO tarafından tescillenmiş eşsiz mutfağıyla Türkiye'nin kültür ve lezzet başkentidir.

---

## 1. Gaziantep'e Genel Bakış ve En İyi Ziyaret Zamanı

Gaziantep'i gezmek için en mükemmel aylar **Ekim - Kasım** (Sonbahar fıstık hasadı dönemi) ve **Nisan - Mayıs** (İlkbahar) aylarıdır. Hava sıcaklığının ideal olduğu bu dönemlerde çarşıları adımlamak ve açık havada kebap/baklava ziyafeti çekmek unutulmaz bir deneyimdir.

---

## 2. 2 Günlük İdeal Gaziantep Gezi Rotası

### 1. Gün: Mozaikler, Tarihi Kale ve Çarşılar
* **08:30 - Güne Beyran Çorbası ile Başlangıç:** Metanet veya Kelebek Lokantası'nda kuzu gerdan, pirinç ve bol sarımsaklı meşhur Gaziantep beyranı.
* **10:00 - Zeugma Mozaik Müzesi:** Fırat kıyısındaki villalardan çıkarılan dev taban mozaiklerini, Mars heykelini ve bakışlarıyla insanı büyüleyen ünlü Çingene Kızı mozaiğini inceleyin.
* **13:00 - Gaziantep Kalesi ve Kahramanlık Panorama Müzesi:** Şehrin merkezindeki tarihi tepeyi ve Kurtuluş Savaşı mücadelesini anlatan müzeyi gezin.
* **14:30 - Tarihi Bakırcılar Çarşısı ve Almacı Pazarı:** Çekiç seslerinin yankılandığı otantik sokaklarda bakır cezveleri, kurutulmuş patlıcanları ve taze Antep fıstıklarını keşfedin.
* **16:30 - Tarihi Tahmis Kahvesi (1635):** Asırlık ahşap konakta menengiç kahvesi için, yerel aşıkların türkülerini dinleyin.
* **19:00 - Akşam Kebabı:** İmam Çağdaş veya Halil Usta'da Ali Nazik, küşleme ve meşhur fıstıklı kebap molası.

### 2. Gün: Rumkale, Halfeti ve Tarihi Konaklar
* **09:30 - Bey Mahallesi ve Tarihi Antep Evleri:** Dar taş sokakları, Atatürk Anı Evi'ni ve Oyuncak Müzesi'ni ziyaret edin.
* **12:00 - Fırat Nehri Kıyısında Rumkale:** Fırat'ın turkuaz suları üzerinde yükselen sarp kayalıklara kurulu Roma-Bizans kalesini ve batık şehir Halfeti tekne turunu deneyimleyin.
* **16:30 - Katmer ve Baklava Ziyafeti:** Zekeriya Usta veya Koçak Baklava'da fırından yeni çıkmış sıcak Antep katmeri ve fıstıklı havuç dilimi.
* **18:30 - Dülük Antik Kenti ve Mitras Tapınağı:** Taş Devri'nden bu yana yerleşimin sürdüğü dünyanın en eski yerleşimlerinden Dülük'ü gezin.

---

## 3. Gaziantep'te Ne Yenir? UNESCO Gastronomi Durakları

* **Beyran Çorbası:** Sabah erkenden içilen, 12 saat haşlanmış kuzu eti, et suyu, sarımsak ve pul biberli efsane lezzet.
* **Küşleme:** Kuzunun omurgasından çıkan sinirsiz en yumuşak etin kömür ateşinde ızgarası.
* **Gaziantep Baklavası:** 40 kat incecik el açması yufka, boz iç Antep fıstığı ve hakiki sadeyağ ile fırınlanan coğrafi işaretli şaheser.
* **Gaziantep Katmeri:** İncecik açılan hamurun arasına bol fıstık, şeker ve taze sahan kaymağı konularak fırınlanan sıcak tatlı.
* **Yuvalama:** Minik pirinç köfteleri, nohut, et ve yoğurt sosuyla hazırlanan bayram yemeği.

---

## 4. Pratik Ulaşım ve Seyahat İpuçları

* **Müze Kart:** Zeugma Mozaik Müzesi, Gaziantep Arkeoloji Müzesi ve Rumkale ören yerlerinde geçerlidir.
* **Yürüyüş Kolaylığı:** Tarihi çarşılar ve kale çevresi birbirine yürüme mesafesindedir.`
  },
  {
    title: "Trabzon Gezi Rehberi: Sümela Manastırı, Uzungöl, Yaylalar ve Karadeniz Rotası",
    slug: "trabzon-gezi-rehberi-sumela-manastiri-uzungol-akcaabat-rotasi",
    city_slug: "trabzon",
    cover_image: "https://images.unsplash.com/photo-1572588588568-80b6748e77a1?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Karadeniz'in yeşil başkenti Trabzon'u keşfedin. Kayalara oyulmuş Sümela Manastırı, Uzungöl, Ayasofya Camii, yaylalar ve Akçaabat köftesi durakları.",
    meta_title: "Trabzon Gezi Rehberi: Sümela, Uzungöl ve 2 Günlük Karadeniz Rotası",
    meta_description: "Trabzon'da gezilecek yerler, Sümela Manastırı, Uzungöl, Atatürk Köşkü, Boztepe seyir tepesi ve meşhur Akçaabat köftesi içeren kapsamlı seyahat rehberi.",
    content: `# Trabzon Gezi Rehberi: Sümela Manastırı, Uzungöl, Yaylalar ve Karadeniz Rotası

Karadeniz'in hırçın dalgaları ile yemyeşil dağlarının kucaklaştığı Trabzon; 4000 yıllık tarihi, dik kayalıklara asılı duran Sümela Manastırı, sisli yaylaları ve kendine has zengin kültürüyle bölgenin kalbidir.

---

## 1. Trabzon'a Genel Bakış ve En İyi Ziyaret Zamanı

Trabzon'u gezmek için en elverişli aylar **Mayıs - Eylül** arasındaki dönemdir. Yaylaların çiçek açtığı Haziran-Temmuz ayları doğa yürüyüşleri ve yayla şenlikleri için mükemmelken, sonbaharda dağların büründüğü sarı ve kızıl tonlar fotoğraf tutkunları için eşsiz kareler sunar.

---

## 2. 2 Günlük İdeal Trabzon Gezi Rotası

### 1. Gün: Şehir Merkezi, Atatürk Köşkü ve Sümela Manastırı
* **09:00 - Trabzon Ayasofya Camii:** 13. yüzyıl Komnenos Krallığı'ndan kalan freskleri ve bahçesindeki deniz manzaralı kuleyi gezin.
* **10:30 - Atatürk Köşkü ve Soğuksu Korusu:** Çam ormanları içinde 19. yüzyıl Art Nouveau mimarisindeki zarif köşkü ziyaret edin.
* **12:30 - Akçaabat Köftesi Molası:** Sahil boyunca uzanan meşhur Akçaabat restoranlarında közlenmiş biber ve piyaz eşliğinde köfte ziyafeti.
* **14:30 - Maçka ve Sümela Manastırı:** Karadağ'ın sarp kayalıklarına 300 metre yükseklikte oyulmuş, freskleri ve gizemli su kemerleriyle 1600 yıllık manastırı adımlayın.
* **18:30 - Boztepe Seyir Terası:** Semaver çayı eşliğinde Trabzon limanını ve Karadeniz'i tepeden seyrederek gün batımını izleyin.

### 2. Gün: Uzungöl, Çaykara ve Sürmene
* **09:30 - Sürmene Bıçak Atölyeleri ve Çay Fabrikası:** Meşhur Sürmene dövme çelik bıçaklarını inceleyin ve dalından toplanan taze çayın işlenişini görün.
* **12:00 - Uzungöl Tabiat Parkı:** Heyelan sonucu oluşan gölün etrafında yürüyüş yapın, Seyir Terası'ndan gölün ve minarelerin ikonik fotoğrafını çekin.
* **15:00 - Huser veya Sultan Murat Yaylası:** Bulut denizinin üzerinde Karadeniz'in temiz dağ havasını soluyun.
* **18:00 - Karadeniz Balıkçısı & Kuymak:** Taze Karadeniz hamsisi, mısır ekmeği ve tel tel uzayan sıcak kuymakla günü tamamlayın.

---

## 3. Trabzon'da Ne Yenir? Meşhur Gastronomi Durakları

* **Akçaabat Köftesi:** Dana eti, sarımsak ve özel bayat ekmek harcıyla yoğrulup meşe kömüründe ızgara edilen sulu köfte.
* **Kuymak (Muhlama):** Trabzon mısır unu, köy tereyağı ve eriyen kolot peynirinin tavada nar gibi kızartılmasıyla yapılan efsane lezzet.
* **Trabzon Pidesi (Kapalı & Açık Kıymalı/Peynirli):** Ortasında tereyağı ve yumurta sarısıyla servis edilen çıtır hamurlu pide.
* **Hamsiköy Sütlacı:** Maçka Hamsiköy'ün doğal dağ sütüyle fırınlanan, üzeri bol fındıklı meşhur sütlaç.
* **Karadeniz Hamsi Tava & Mısır Ekmeği:** Mevsiminde çıtır mısır ununa bulanıp tavada dizilerek kızartılan taze hamsi.

---

## 4. Pratik Ulaşım ve Seyahat İpuçları

* **Araç Kiralama:** Sümela Manastırı, Uzungöl ve yaylalar arası mesafe virajlı dağ yollarından oluşur; araç kiralama en esnek seyahat seçeneğidir.
* **Yağmurluk ve Ayakkabı:** Karadeniz'de her an sis ve yağmur bastırabilir; yanınızda mutlaka hafif bir yağmurluk ve su geçirmez ayakkabı bulundurun.`
  },
  {
    title: "Şanlıurfa Gezi Rehberi: Göbeklitepe, Balıklıgöl, Tarihi Hanlar ve Sıra Gecesi",
    slug: "sanliurfa-gezi-rehberi-gobeklitepe-balikligol-harran-rotasi",
    city_slug: "sanliurfa",
    cover_image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Peygamberler Şehri Şanlıurfa'yı keşfedin. Tarihin sıfır noktası Göbeklitepe, Balıklıgöl, Harran Kümbet Evleri, tarihi çarşılar ve ciğer kebabı durakları.",
    meta_title: "Şanlıurfa Gezi Rehberi: Göbeklitepe, Balıklıgöl ve Harran Rotası",
    meta_description: "Şanlıurfa'da gezilecek yerler, Göbeklitepe, Balıklıgöl Platosu, Harran Konik Evleri, Haleplibahçe Mozaikleri ve sıra gecesi lezzetleri içeren gezi rehberi.",
    content: `# Şanlıurfa Gezi Rehberi: Göbeklitepe, Balıklıgöl, Tarihi Hanlar ve Sıra Gecesi

Tarihin sıfır noktası, dinlerin, medeniyetlerin ve efsanelerin doğduğu peygamberler şehri Şanlıurfa; 12 bin yıllık Göbeklitepe tapınakları, kutsal Balıklıgöl'ü, konik kubbeli Harran evleri ve zengin mutfağıyla insanlık tarihine açılan mistik bir kapıdır.

---

## 1. Şanlıurfa'ya Genel Bakış ve En İyi Ziyaret Zamanı

Şanlıurfa'yı ziyaret etmek için en uygun mevsim **Ekim - Kasım** (Sonbahar) ve **Mart - Nisan** (İlkbahar) aylarıdır. Yaz aylarında sıcaklıklar 40 derecenin üzerine çıkabildiğinden, tarihi alanları rahatça gezebilmek için ılık bahar günleri tercih edilmelidir.

---

## 2. 2 Günlük İdeal Şanlıurfa Gezi Rotası

### 1. Gün: Göbeklitepe, Müzeler Kompleksi ve Balıklıgöl
* **09:00 - Göbeklitepe Ören Yeri (UNESCO):** İnsanlığın avcı-toplayıcı dönemden yerleşik hayata geçişini ve tapınak mimarisini temsil eden 12.000 yıllık T biçimli dev taş sütunları görün.
* **12:00 - Şanlıurfa Arkeoloji ve Mozaik Müzesi:** Türkiye'nin en büyük müze kompleksinde dünyanın en eski heykeli olan Urfa Adamı'nı ve Amazon kadınları mozaiklerini gezin.
* **15:00 - Balıklıgöl (Halil-ür Rahman) ve Aynzeliha Gölü:** Hz. İbrahim'in ateşe atıldığına ve ateşin suya, odunların balığa dönüştüğüne inanılan kutsal gölü ve çevresindeki Rızvaniye Camii'ni ziyaret edin.
* **17:00 - Tarihi Gümrük Hanı ve Çarşılar:** Asırlık çınarlar altında menengiç kahvesi veya mırra için, bakırcılar ve isot çarşılarını gezin.
* **20:00 - Geleneksel Şanlıurfa Sıra Gecesi:** Tarihi bir konakta canlı çiğ köfte yoğurma seremonisi ve yöresel türküler eşliğinde sıra gecesi kültürünü yaşayın.

### 2. Gün: Harran, Kümbet Evler ve Karahantepe
* **09:30 - Harran Konik Kubbeli Kümbet Evleri:** Harcında gül yağı ve yumurta akı kullanılan, yazın serin kışın sıcak tutan 250 yıllık tarihi evleri ve dünyanın ilk İslam üniversitesinin kalıntılarını görün.
* **13:00 - Karahantepe:** Taş Tepeler projesinin en heyecan verici Neolitik alanlarından birini keşfedin.
* **16:00 - Şanlıurfa Kalesi:** Damlacık Tepesi'ndeki kaleye çıkıp iki büyük korint sütunu ve tüm Balıklıgöl platosunu tepeden fotoğraflayın.

---

## 3. Şanlıurfa'da Ne Yenir? Meşhur Gastronomi Durakları

* **Şanlıurfa Ciğer Kebabı:** Sabah erken saatlerde veya gece lavaş ekmeği arasında taze nane, közlenmiş isot ve soğan salatasıyla yenen kuzu ciğer şiş.
* **Urfa Kebabı & Haşhaş Kebabı:** Zırhtan geçirilmiş kuzu etiyle yapılan acısız veya isotlu şiş kebap.
* **Çiğ Köfte:** Etli, hakiki isotlu, taş dibekte yoğrulan tescilli çiğ köfte.
* **Şıllık Tatlısı:** İncecik krep hamuru arasına ceviz içi konularak üzerine tereyağlı şerbet dökülen geleneksel tatlı.
* **Mırra Kahvesi:** Birkaç kez kaynatılarak yoğunlaştırılan geleneksel ikram kahvesi.

---

## 4. Pratik Ulaşım ve Seyahat İpuçları

* **Müze Kart:** Göbeklitepe, Şanlıurfa Arkeoloji Müzesi, Haleplibahçe Mozaik Müzesi ve Karahantepe'de geçerlidir.
* **Harran Ulaşımı:** Şehir merkezinden Harran'a minibüslerle veya araç kiralayarak yaklaşık 45 dakikada ulaşabilirsiniz.`
  }
];

async function main() {
  console.log("🚀 Kapsamlı Şehir Gezi Rehberleri Supabase veritabanına aktarılıyor...\n");

  let success = 0;
  for (const guide of richCityGuides) {
    const payload = {
      title: guide.title,
      slug: guide.slug,
      excerpt: guide.excerpt,
      content: guide.content,
      cover_image: guide.cover_image,
      city_slug: guide.city_slug,
      meta_title: guide.meta_title,
      meta_description: guide.meta_description,
      is_published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('articles')
      .upsert(payload, { onConflict: 'slug' });

    if (error) {
      console.error(`❌ Yüklenemedi [${guide.slug}]:`, error.message);
    } else {
      const wordCount = guide.content.split(/\s+/).filter(Boolean).length;
      console.log(`✅ [${++success}/${richCityGuides.length}] ${guide.title} (${wordCount} Kelime - Şehir: ${guide.city_slug})`);
    }
  }

  console.log(`\n🎉 Toplam ${success} adet zengin Şehir Gezi Rehberi başarıyla yüklendi!`);
}

main().catch(console.error);
