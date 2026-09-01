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

const richCityGuidesPart2 = [
  {
    title: "Ankara Gezi Rehberi: Cumhuriyetin Kalbi Anıtkabir, Tarihi Kale ve Gordion Rotası",
    slug: "ankara-gezi-rehberi-anitkabir-kale-gordion-rotasi",
    city_slug: "ankara",
    cover_image: "https://images.unsplash.com/photo-1589779260460-70f2095f9c46?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Başkent Ankara'yı keşfedin. Anıtkabir, Anadolu Medeniyetleri Müzesi, Ankara Kalesi, Hamamönü, UNESCO mirası Gordion ve meşhur Ankara döneri durakları.",
    meta_title: "Ankara Gezi Rehberi: Anıtkabir, Kale ve 2 Günlük Rota",
    meta_description: "Ankara'da gezilecek yerler, Anıtkabir ziyareti, Anadolu Medeniyetleri Müzesi, Hamamönü, Gordion Antik Kenti ve gastronomi durakları içeren gezi rehberi.",
    content: `# Ankara Gezi Rehberi: Cumhuriyetin Kalbi Anıtkabir, Tarihi Kale ve Gordion Rotası

Türkiye Cumhuriyeti'nin kalbi, binlerce yıllık Frigya, Galat, Roma ve Selçuklu mirasını barındıran başkent Ankara; anıtsal mimarisi, ödüllü müzeleri ve köklü kültürel belleğiyle her seyahatseverin görmesi gereken asil bir kenttir.

---

## 1. Ankara'ya Genel Bakış ve En İyi Ziyaret Zamanı

Ankara'yı ziyaret etmek için en güzel aylar **Eylül - Ekim** (Sonbahar) ve **Nisan - Mayıs** (İlkbahar) dönemidir. Kışları karasal iklimin soğuğu hissedilirken, bahar aylarında Kuğulu Park'ta yürümek, müzeleri gezmek ve Hamamönü konaklarında çay içmek son derece keyiflidir.

---

## 2. 2 Günlük İdeal Ankara Gezi Rotası

### 1. Gün: Cumhuriyet Mirası, Müzeler ve Tarihi Kale
* **09:00 - Anıtkabir ve Kurtuluş Savaşı Müzesi:** Aslanlı Yol'dan yürüyerek ulu önder Mustafa Kemal Atatürk'ün mozolesini, tören meydanını ve alt galerilerdeki zengin müzeyi ziyaret edin.
* **11:30 - Anadolu Medeniyetleri Müzesi (Avrupa Yılın Müzesi):** Paleolitik çağdan Hitit, Frig ve Urartu krallıklarına uzanan dünyanın en seçkin arkeoloji koleksiyonunu gezin.
* **14:00 - Ankara Kalesi ve Tarihi Samanpazarı:** Kale burçlarına tırmanarak 360 derece başkent manzarasını seyredin; Pirinç Han ve antikacılar çarşısını keşfedin.
* **16:30 - Hamamönü Tarihi Konakları:** Restore edilen ahşap cumbalı evleri, Mehmet Akif Ersoy Müze Evi'ni ve sanat sokağını adımlayın.
* **18:30 - Kuğulu Park ve Tunalı Hilmi Caddesi:** Kuğuları izleyerek dinlenin, başkentin sosyal yaşamının merkezinde yürüyüş yapın.

### 2. Gün: Cumhuriyetin İlk Yapıları ve Gordion (Polatlı)
* **09:30 - 1. ve 2. TBMM Binaları (Kurtuluş Savaşı ve Cumhuriyet Müzesi):** Ulus meydanındaki tarihi meclis salonlarını görün.
* **12:00 - Hacı Bayram-ı Veli Camii ve Augustus Tapınağı:** Maneviyat ile Roma tarihinin yan yana yükseldiği kadim mekanı ziyaret edin.
* **14:30 - Gordion Antik Kenti (UNESCO Dünya Mirası):** Polatlı'da Frig Krallığı'nın başkentini, Kral Midas'ın ahşap mezar odasını barındıran dev Tümülüs'ü keşfedin.

---

## 3. Ankara'da Ne Yenir? Meşhur Gastronomi Durakları

* **Ankara Döneri:** İncecik yaprak kesim, kuzu ve dana eti karışımıyla hazırlanan yağsız ve lezzetli hakiki Ankara döneri.
* **Ankara Simidi:** Bol susamlı ve dut pekmezine batırılarak fırınlanan koyu renkli gevrek simit.
* **Beypazarı Kurusu:** Bol tereyağlı, kıtır kıtır taş fırın kurusu.
* **Beypazarı Güveci:** Taş fırında saatlerce pişen kuzu etli ve pirinçli geleneksel güveç.`
  },
  {
    title: "Bursa Gezi Rehberi: Osmanlı'nın İlk Başkenti, Ulu Camii, Cumalıkızık ve İskender Kebap",
    slug: "bursa-gezi-rehberi-ulu-camii-cumalikizik-yesil-turbe-iskender",
    city_slug: "bursa",
    cover_image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Yeşil Bursa'yı keşfedin. Ulu Camii'nin 20 kubbesi, Cumalıkızık Köyü, Yeşil Türbe, Kozahan, Uludağ teleferik turu ve hakiki İskender kebabı durakları.",
    meta_title: "Bursa Gezi Rehberi: Ulu Camii, Cumalıkızık ve 2 Günlük Rota",
    meta_description: "Bursa'da gezilecek yerler, Tarihi Kozahan, Ulu Camii, Cumalıkızık Köyü, Yeşil Külliye ve meşhur İskender kebap durakları içeren kapsamlı gezi rehberi.",
    content: `# Bursa Gezi Rehberi: Osmanlı'nın İlk Başkenti, Ulu Camii, Cumalıkızık ve İskender Kebap

Osmanlı İmparatorluğu'nun ilk payitahtı, ipeğin, ulu çınarların ve termal suların şehri Yeşil Bursa; zengin tarihi mirası, UNESCO tescilli Cumalıkızık köyü ve enfes mutfağıyla seyahatseverlerin gözdesidir.

---

## 1. Bursa'ya Genel Bakış ve En İyi Ziyaret Zamanı

Bursa her mevsim ayrı güzeldir. Kültür turları ve tarihi çarşıları gezmek için **İlkbahar (Nisan-Mayıs)** ve **Sonbahar (Eylül-Ekim)** ayları idealdir. Kışın Uludağ'da kayak yapmak, baharda ise çınar altlarında çay yudumlamak için mükemmel bir rotadır.

---

## 2. 2 Günlük İdeal Bursa Gezi Rotası

### 1. Gün: Tarihi Merkez, Hanlar Bölgesi ve Külliyeler
* **09:00 - Bursa Ulu Camii:** 20 kubbesi, içindeki dev şadırvanı ve duvarlarındaki paha biçilmez hat levhalarıyla erken Osmanlı mimarisinin zirvesini ziyaret edin.
* **10:30 - Kozahan ve Kapalı Çarşı:** İpek Yolu'nun son durağı olan Kozahan avlusunda asırlık çınarların altında Türk kahvesi için, hakiki ipek şalları inceleyin.
* **13:00 - Tarihi İskender Kebap Molası:** Kebapçı İskender veya Tarihi Ahşap Dükkanda tereyağlı pide üzerinde döner ve yoğurt ziyafeti.
* **15:00 - Yeşil Camii ve Yeşil Türbe:** Çelebi Mehmed'in turkuaz ve yeşil çinilerle süslü ebedi istirahatgahını gezin.
* **17:00 - Tophane Saat Kulesi ve Osman Gazi / Orhan Gazi Türbeleri:** Bursa'nın fatihlerinin türbelerini ziyaret edip seyir terasından kenti kuşbakışı izleyin.

### 2. Gün: Cumalıkızık Köyü, Muradiye ve Gölyazı
* **09:00 - Cumalıkızık UNESCO Köyü:** 700 yıllık taş sokakları, rengarenk cumbalı evleri ve yöresel köy kahvaltısını deneyimleyin.
* **12:30 - Muradiye Külliyesi:** Fatih Sultan Mehmed'in ailesine, Cem Sultan ve Şehzade Mustafa'ya ait türbelerin mistik sükunetini yaşayın.
* **15:30 - Gölyazı (Apolyont) Yarımadası:** Uluabat Gölü üzerindeki köprüyle bağlı şirin adayı, Ağlayan Çınar'ı gezin ve gölde kayık turu yapın.
* **18:30 - Gölyazı'da Gün Batımı:** Göl kıyısında balıkçı tekneleri arasında gün batımını fotoğraflayın.

---

## 3. Bursa'da Ne Yenir? Meşhur Gastronomi Durakları

* **Hakiki Bursa İskender Kebabı:** Pide üzerine ince döner dilimleri, domates sosu, kızgın keçi tereyağı ve tava yoğurdu.
* **Bursa Kestane Şekeri:** Şeker şerbetinde kaynatılan taze kestane tatlısı (Kafkas veya Kardelen).
* **Pideli Köfte:** Kayhan Çarşısı'nda küçük ızgara köftelerin tereyağlı pideyle sunumu.
* **Cantık:** Fırından yeni çıkmış çıtır yuvarlak kıymalı Bursa pidesi.
* **Tirilye Zeytini ve Zeytinyağı:** İnce kabuklu tescilli sofralık siyah zeytin.`
  },
  {
    title: "Mardin Gezi Rehberi: Mezopotamya Ovası, Taş Konaklar ve Manastırlar Rotası",
    slug: "mardin-gezi-rehberi-tas-konaklar-manastirlar-dara-rotasi",
    city_slug: "mardin",
    cover_image: "https://images.unsplash.com/photo-1570857502809-08184874388e?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Dillerin ve dinlerin buluştuğu masal kent Mardin'i keşfedin. Eski Mardin taş evleri, Deyrulzafaran Manastırı, Dara Antik Kenti ve kaburga dolması durakları.",
    meta_title: "Mardin Gezi Rehberi: Taş Evler, Deyrulzafaran ve Dara Rotası",
    meta_description: "Mardin'de gezilecek yerler, Eski Mardin sokakları, Kasımiye Medresesi, Deyrulzafaran Manastırı, Midyat ve yöresel lezzetler içeren gezi rehberi.",
    content: `# Mardin Gezi Rehberi: Mezopotamya Ovası, Taş Konaklar ve Manastırlar Rotası

Gecesi gerdanlık, gündüzü seyranlık Mardin; sarı kalker taşından oyulmuş nakış gibi konakları, camileri, kiliseleri ve sonsuz Mezopotamya ovasına bakan teraslarıyla adeta bir açık hava müzesidir.

---

## 1. Mardin'e Genel Bakış ve En İyi Ziyaret Zamanı

Mardin'i ziyaret etmek için en güzel mevsimler **Ekim - Kasım** (Sonbahar) ve **Nisan - Mayıs** (İlkbahar) aylarıdır. Yaz aylarında Güneydoğu sıcağı etkili olurken, sonbaharda taş sokaklarda serin esintiler eşliğinde yürümek ve teraslarda Süryani çayı içmek büyüleyicidir.

---

## 2. 2 Günlük İdeal Mardin Gezi Rotası

### 1. Gün: Eski Mardin Sokakları, Medreseler ve Kiliseler
* **09:00 - Birinci Cadde ve Tarihi Abbaralar:** Eski Mardin'in dar sokaklarında, evlerin altından geçen kemerli tünelleri (abbaraları) keşfedin.
* **10:30 - Kasımiye Medresesi:** Artuklu döneminden kalan medresenin havuzlu avlusunda hayat felsefesini simgeleyen su akışını ve taş işçiliğini inceleyin.
* **12:30 - Kırklar Kilisesi (Mor Behnam):** 6. yüzyıldan kalan tarihi Süryani Ortodoks kilisesinin mistik atmosferini ve ahşap oymalarını görün.
* **14:30 - Mardin Ulu Camii:** Dilimli kubbesi ve Mezopotamya ovasına bakan avlusuyla kentin simgesi olan camiyi ziyaret edin.
* **16:30 - Sakıp Sabancı Mardin Kent Müzesi:** Şehrin çok kültürlü tarihini ve zanaatlarını sergileyen müzeyi gezin.
* **18:30 - Tarihi Terasta Gün Batımı:** Eski Mardin konaklarının terasından sonsuz Mezopotamya ovasının kızıla bürünüşünü seyredin.

### 2. Gün: Deyrulzafaran, Dara Antik Kenti ve Midyat
* **09:30 - Deyrulzafaran Manastırı:** Güneş Tapınağı üzerine kurulan, yüzyıllarca Süryani Patrikliği merkezi olan kadim manastırda safran çayı için.
* **12:00 - Dara Antik Kenti (Doğu'nun Efes'i):** Kayalara oyulmuş devasa su sarnıçlarını, agorayı ve nekropol alanını keşfedin.
* **15:00 - Midyat Devlet Konukevi ve Telkâri Çarşısı:** Dizilere ev sahipliği yapan tarihi taş konağı gezin, gümüş telkâri ustalarını atölyelerinde izleyin.
* **17:30 - Mor Gabriel Manastırı:** Dünyanın ayakta kalan en eski Süryani Ortodoks manastırlarından birini ziyaret edin.

---

## 3. Mardin'de Ne Yenir? Meşhur Gastronomi Durakları

* **Kaburga Dolması:** İç pilavla doldurularak saatlerce kısık ateşte lokum gibi pişen kuzu kaburgası.
* **Sembusek (Mardin Kapalı Pidesi):** İncecik hamur arasına kıyma, soğan ve baharat harcı konularak fırınlanan lezzet.
* **İrok & İkbebet:** Mardin usulü kızarmış veya haşlanmış içli köfte.
* **Süryani Şarabı & Badem Şekeri:** Mavi boyalı hayalet badem şekeri ve mahlepli yöresel çörekler.
* **Dibek Kahvesi:** Kakule ve çeşitli şifalı baharatlarla taş dibekte dövülen yumuşak içimli kahve.`
  },
  {
    title: "Edirne Gezi Rehberi: Mimar Sinan'ın Selimiye'si, Meriç Köprüleri ve Tava Ciğeri",
    slug: "edirne-gezi-rehberi-selimiye-meric-koprusu-tava-ciger",
    city_slug: "edirne",
    cover_image: "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?q=80&w=1600&auto=format&fit=crop",
    excerpt: "Balkanların kapısı Edirne'yi keşfedin. Mimar Sinan'ın başyapıtı Selimiye Camii, II. Bayezid Külliyesi Sağlık Müzesi, Meriç Köprüsü ve tava ciğeri durakları.",
    meta_title: "Edirne Gezi Rehberi: Selimiye Camii, Meriç ve 2 Günlük Rota",
    meta_description: "Edirne'de gezilecek yerler, Selimiye Camii, Sağlık Müzesi, Tarihi Kırkpınar Er Meydanı, Meriç Köprüsü ve meşhur tava ciğeri durakları içeren gezi rehberi.",
    content: `# Edirne Gezi Rehberi: Mimar Sinan'ın Selimiye'si, Meriç Köprüleri ve Tava Ciğeri

Osmanlı İmparatorluğu'na 88 yıl başkentlik yapmış, Mimar Sinan'ın dehasıyla taçlanmış sınır kenti Edirne; nehirleri, tarihi köprüleri, saray kalıntıları ve eşsiz lezzetleriyle Trakya'nın göz bebeğidir.

---

## 1. Edirne'ye Genel Bakış ve En İyi Ziyaret Zamanı

Edirne'yi ziyaret etmek için en ideal zaman **Nisan - Mayıs** (Kakava ve Hıdırellez şenlikleri dönemi) ile **Eylül - Ekim** aylarıdır. Temmuz ayında düzenlenen Tarihi Kırkpınar Yağlı Güreşleri de şehre ayrı bir coşku katar.

---

## 2. 2 Günlük İdeal Edirne Gezi Rotası

### 1. Gün: Mimar Sinan Şaheserleri ve Tarihi Merkez
* **09:00 - Selimiye Camii ve Külliyesi (UNESCO):** Mimar Sinan'ın 80 yaşında yaptığı ve "Ustalık eserim" dediği 4 minareli muazzam mabedi, çinilerini ve ters lale motifini görün.
* **11:00 - Eski Camii ve Üç Şerefeli Camii:** Duvarlarındaki devasa hat yazılarıyla Eski Camii'yi ve Osmanlı mimarisinde ilk kez uygulanan çok şerefeli minareleri gezin.
* **12:30 - Meşhur Edirne Tava Ciğeri Molası:** Ciğerci Niyazi veya Kazım Usta'da yaprak gibi incecik doğranmış çıtır ciğer ve yanında kurutulmuş Karaağaç acı biberi ziyafeti.
* **14:30 - Ali Paşa ve Arasta Çarşıları:** Aynalı süpürgeler, badem ezmeleri ve meyve sabunlarını keşfedin.
* **16:30 - Sultan II. Bayezid Külliyesi ve Sağlık Müzesi:** Avrupa Konseyi Müze Ödüllü külliyede su sesi, ney melodisi ve koku ile akıl hastalarının tedavi edildiği tarihi şifahaneyi gezin.

### 2. Gün: Meriç, Tunca ve Karaağaç
* **09:30 - Tarihi Meriç ve Tunca Köprüleri:** Osmanlı taş köprülerinin üzerinden yürüyerek nehir kıyısındaki çay bahçelerinde sabah çayı için.
* **11:30 - Karaağaç Mahallesi ve Tarihi Tren Garı:** Lozan Anıtı ve Müzesi'ni gezin, nostaljik kafelerin sıralandığı Karaağaç sokaklarını keşfedin.
* **14:30 - Sarayiçi ve Kırkpınar Meydanı:** Edirne Sarayı kalıntılarını (Saray-ı Cedid-i Amire), Adalet Kasrı'nı ve Fatih Köprüsü'nü ziyaret edin.

---

## 3. Edirne'de Ne Yenir? Meşhur Gastronomi Durakları

* **Edirne Tava Ciğeri:** Sinirleri temizlenmiş süt danası ciğerinin kızgın ayçiçek yağında saniyeler içinde çıtır pişirilmesi.
* **Edirne Badem Ezmesi:** Keşan bademleri ve pancar şekeriyle yapılan asırlık saray tatlısı (Keçecizade).
* **Kallavi Kurabiyesi:** Un, yağ ve tuz kullanılmadan; Antep fıstığı, bal ve safranla yapılan tarihi kurabiye.
* **Edirne Beyaz Peyniri:** Trakya meralarının zengin sütleriyle olgunlaştırılan sert ve yağlı koyun/keçi peyniri.`
  }
];

async function main() {
  console.log("🚀 2. Kısım Şehir Gezi Rehberleri Supabase veritabanına aktarılıyor...\n");

  let success = 0;
  for (const guide of richCityGuidesPart2) {
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
      console.log(`✅ [${++success}/${richCityGuidesPart2.length}] ${guide.title} (${wordCount} Kelime - Şehir: ${guide.city_slug})`);
    }
  }

  console.log(`\n🎉 2. Kısım Gezi Rehberleri de başarıyla yüklendi!`);
}

main().catch(console.error);
