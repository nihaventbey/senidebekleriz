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

const sampleNews = [
  {
    title: "Göbeklitepe ve Karahantepe Kazılarında Taş Tepeler Projesi Kapsamında Yeni Heykeller Bulundu",
    slug: "gobeklitepe-karahantepe-yeni-heykeller-kesfedildi",
    summary: "Şanlıurfa Taş Tepeler projesi kapsamında yürütülen 2026 yılı arkeolojik kazılarında, Neolitik döneme ait gerçekçi insan ve leopar kabartmalı heykeller gün ışığına çıkarıldı.",
    category: "arkeoloji",
    city_slug: "sanliurfa",
    cover_image: "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?q=80&w=1200&auto=format&fit=crop",
    source_name: "Kültür ve Turizm Bakanlığı Kazılar Dairesi",
    source_url: "https://www.kulturportali.gov.tr",
    is_published: true,
    is_featured: true,
    content: `## Neolitik Çağın Gizemleri Taş Tepeler ile Aydınlanıyor

Şanlıurfa sınırları içinde yer alan ve insanlık tarihinin bilinen en eski yerleşim katmanlarını barındıran **Taş Tepeler Projesi** bünyesinde Karahantepe ve Göbeklitepe kazılarında çığır açan yeni buluntulara ulaşıldı. Kültür ve Turizm Bakanlığı koordinasyonunda sürdürülen kazılarda, kireç taşı blok üzerine ince ustalıkla oyulmuş insan ve leopar figürleri tespit edildi.

### Kazı Heyetinden Heyecan Verici Açıklama

Kazı başkanı Prof. Dr. Necmi Karul yaptığı açıklamada, bulunan yeni eserlerin günümüzden yaklaşık 11.500 yıl öncesine tarihlendiğini ve o dönem insanının gelişmiş estetik anlayışını ve sembolik dünyasını benzersiz bir şekilde yansıttığını belirtti.

> "Taş Tepeler yalnızca Şanlıurfa'nın değil, dünya uygarlık tarihinin başlangıç noktasıdır. Açığa çıkardığımız her yeni figür, avcı-toplayıcı toplulukların sosyal organizasyon gücünü yeniden düşünmemizi sağlıyor."

### Ziyaretçiler İçin Şanlıurfa Arkeoloji Müzesi

Ortaya çıkarılan heykeller titiz bir konservasyon sürecinin ardından Türkiye'nin en büyük kapalı sergileme alanına sahip olan **Şanlıurfa Arkeoloji Müzesi**'nde özel bir seksiyonda ziyarete açılacak.

## Kaynak ve Detaylar
* **Kaynak:** T.C. Kültür ve Turizm Bakanlığı Kültür Varlıkları ve Müzeler Genel Müdürlüğü
* **Konum:** Şanlıurfa / Haliliye - Karahantepe Ören Yeri`
  },
  {
    title: "Tarihi Sultanahmet Yerebatan Sarnıcı Restorasyonu Uluslararası Mimarlık Ödülüne Layık Görüldü",
    slug: "yerebatan-sarnici-restorasyonu-uluslararasi-mimarlik-odulu",
    summary: "İstanbul'un 1500 yıllık görkemli su sarayı Yerebatan Sarnıcı, tamamlanan kapsamlı güçlendirme ve çağdaş ışık tasarımı restorasyonuyla Avrupa Tarihi Miras Ödülü'nü kazandı.",
    category: "restorasyon",
    city_slug: "istanbul",
    cover_image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop",
    source_name: "İBB Miras & UNESCO Türkiye",
    source_url: "https://www.kulturportali.gov.tr",
    is_published: true,
    is_featured: true,
    content: `## 1500 Yıllık Yeraltı Sarayı Yeniden Işıldıyor

Bizans İmparatoru I. Justinianus döneminde (527-565) inşa edilen ve yüzyıllar boyunca kentin su ihtiyacını karşılayan **Yerebatan Sarnıcı (Basilica Cistern)**, gerçekleştirilen titiz restorasyon projesinin ardından uluslararası arenada büyük bir başarıya imza attı.

### Deprem Güçlendirmesi ve Şeffaf Yürüme Yolları

Proje kapsamında sarnıcın 336 adet sütunu depreme karşı paslanmaz çelik gergilerle koruma altına alındı. Ziyaretçilerin su seviyesine daha yakın ve sütun ormanının ihtişamını hissedebileceği şeffaf modüler yürüme platformları yerleştirildi. Ünlü Medusa başları ise özel heykelsi aydınlatma ile mistik atmosferine kavuşturuldu.

### Çağdaş Sanat Enstalasyonları ile Yaşayan Miras

Yerebatan Sarnıcı sadece bir anıt yapı değil, aynı zamanda uluslararası sanatçıların heykel ve ışık sergilerine ev sahipliği yapan dinamik bir kültür mekanına dönüştü.

## Kaynak ve Detaylar
* **Ödül:** Europa Nostra Koruma ve Yeniden Canlandırma Ödülü
* **Konum:** Fatih / İstanbul`
  },
  {
    title: "Türkiye Kültür Yolu Festivali 2026 Sezonu 16 Şehirde Milyonlarca Sanatseverle Buluşuyor",
    slug: "turkiye-kultur-yolu-festivali-2026-sehirlere-yayiliyor",
    summary: "Adana'dan Trabzon'a, Çanakkale'den Diyarbakır'a uzanan Türkiye Kültür Yolu Festivali; yüzlerce konser, opera, tiyatro ve açık hava sergisiyle perdelerini açtı.",
    category: "festival_haberleri",
    city_slug: "canakkale",
    cover_image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
    source_name: "Türkiye Kültür Yolu Festivali Genel Koordinatörlüğü",
    source_url: "https://kulturyolufestivali.com",
    is_published: true,
    is_featured: true,
    content: `## Şehirlerin Kültür Damarları Sanatla Buluşuyor

Türkiye'nin en kapsamlı kültür-sanat maratonu olan **Türkiye Kültür Yolu Festivali**, 2026 takvimiyle birlikte 16 farklı şehirde kesintisiz sanat şöleni sunuyor. Festival rotasında tarihi kaleler, amfi tiyatrolar, kervansaraylar ve modern kültür merkezleri birer sahneye dönüşüyor.

### Öne Çıkan Festival Durakları

1. **Çanakkale Kültür Yolu:** Troya Ören Yeri ve Kordon boyunda açık hava senfoni konserleri.
2. **Diyarbakır Kültür Yolu:** Tarihi Suriçi, Dengbêj Evi ve İçkale Müze Kompleksi'nde geleneksel ezgiler ve çağdaş sergiler.
3. **Nevşehir Kapadokya Festivali:** Peri bacaları arasında gün doğumunda sıcak hava balonları eşliğinde caz ve klasik müzik dinletileri.
4. **İzmir & Efes Kültür Yolu:** Efes Antik Tiyatrosu'nda Devlet Opera ve Balesi'nin unutulmaz başyapıtları.

### Ücretsiz ve Halka Açık Etkinlikler

Festival programında yer alan yüzlerce sokak performansı, çocuk atölyeleri, dijital sanat enstalasyonları ve açık hava film gösterimleri tüm vatandaşlara ücretsiz olarak sunuluyor.

## Kaynak ve Detaylar
* **Resmi Site:** [kulturyolufestivali.com](https://kulturyolufestivali.com)
* **Kapsam:** 16 Şehir, 600+ Etkinlik, 4000+ Sanatçı`
  },
  {
    title: "Cumhuriyet Dönemi Başyapıtı Ankara Devlet Resim ve Heykel Müzesi Koleksiyonu Dijitalleştirildi",
    slug: "ankara-resim-heykel-muzesi-koleksiyonu-dijital-arsiv",
    summary: "Osman Hamdi Bey'den Şeker Ahmed Paşa'ya, İbrahim Çallı'dan Fikret Mualla'ya Türk resim ve heykel sanatının 4 bini aşkın nadide eseri yüksek çözünürlükle dijital arşive aktarıldı.",
    category: "muze_sergi",
    city_slug: "ankara",
    cover_image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop",
    source_name: "Ankara Devlet Resim ve Heykel Müzesi",
    source_url: "https://www.kulturportali.gov.tr",
    is_published: true,
    is_featured: false,
    content: `## Türk Plastik Sanatlarının Hafızası Dünyaya Açılıyor

Mimar Arif Hikmet Koyunoğlu'nun 1927 yılında projelendirdiği tarihi Türk Ocağı binasında hizmet veren **Ankara Devlet Resim ve Heykel Müzesi**, sahip olduğu paha biçilmez koleksiyonu sanatseverlerin ve araştırmacıların erişimine açan kapsamlı bir dijital arşiv projesini tamamladı.

### 4 Binden Fazla Başyapıt Yüksek Çözünürlükte

Koleksiyonda yer alan tablolar, heykeller, seramikler ve gravürler ultraviyole ve kızılötesi tarama teknikleriyle belgelendi. Sanatseverler Osman Hamdi Bey'in ünlü kompozisyonlarını, Hoca Ali Rıza'nın peyzajlarını ve Cumhuriyet kuşağı ressamlarının fırça darbelerini en ince ayrıntısına kadar inceleyebilecek.

### Müzede Canlı Sergi ve Restorasyon Laboratuvarı

Fiziki müzeyi ziyaret edenler ise restorasyon laboratuvarını cam bölmeler arkasından canlı olarak izleyebiliyor ve uzman restoratörlerin tarihi tuvalleri nasıl hayata döndürdüğüne tanıklık ediyor.

## Kaynak ve Detaylar
* **Konum:** Altındağ / Ankara (Ulus Tarihi Kent Merkezi)
* **Kaynak:** Güzel Sanatlar Genel Müdürlüğü`
  },
  {
    title: "Efes Antik Kenti'nde 'Gece Müzeciliği' Uygulaması Rekor Ziyaretçi Sayısına Ulaştı",
    slug: "efes-antik-kenti-gece-muzeciligi-rekor-ziyaretci",
    summary: "Özel LED aydınlatma projesiyle gün batımından gece yarısına kadar kapılarını açık tutan Efes Antik Kenti, Celsus Kütüphanesi ve Kuretler Caddesi'nde binlerce kişiyi ağırlıyor.",
    category: "kultur_sanat",
    city_slug: "izmir",
    cover_image: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?q=80&w=1200&auto=format&fit=crop",
    source_name: "T.C. Kültür ve Turizm Bakanlığı",
    source_url: "https://www.kulturportali.gov.tr",
    is_published: true,
    is_featured: false,
    content: `## Antik Çağın İncisi Efes Yıldızlar Altında Büyülüyor

UNESCO Dünya Mirası Listesi'nde yer alan İzmir Selçuk'taki **Efes Antik Kenti**, hayata geçirilen Gece Müzeciliği konsepti ile kültür turizminde yeni bir çağ başlattı. Gündüz sıcaklığından etkilenmeden tarihi atmosferi yaşamak isteyen ziyaretçiler gece aydınlatması eşliğinde antik kentin sokaklarını keşfediyor.

### Celsus Kütüphanesi ve Tiyatroda Büyüleyici Işıklandırma

Kentin simgesi olan Celsus Kütüphanesi cephesi, tarihi dokuya zarar vermeyen özel soğuk ışık teknolojisiyle aydınlatıldı. 25 bin kişilik Büyük Antik Tiyatro ve mermer döşeli Kuretler Caddesi boyunca uzanan sütunlar, gece karanlığında gökyüzündeki yıldızlarla birleşerek masalsı bir görsel şölen sunuyor.

### Müzekart Sahiplerine Gece Giriş İmkanı

Türkiye Cumhuriyeti vatandaşları Müzekart ile Gece Müzeciliği saatlerinde Efes Ören Yeri'ni ziyaret edebiliyor.

## Kaynak ve Detaylar
* **Ziyaret Saatleri:** Yaz sezonunda 00:00'a kadar açık
* **Konum:** Selçuk / İzmir`
  }
];

async function main() {
  console.log("🚀 Kültür-Sanat haberleri veritabanına aktarılıyor...\n");

  for (const item of sampleNews) {
    const { data: existing } = await supabase
      .from('cultural_news')
      .select('id, slug')
      .eq('slug', item.slug)
      .maybeSingle();

    if (existing) {
      console.log(`ℹ️ Zaten mevcut: ${item.title.slice(0, 40)}...`);
      await supabase
        .from('cultural_news')
        .update({
          title: item.title,
          summary: item.summary,
          content: item.content,
          cover_image: item.cover_image,
          category: item.category,
          city_slug: item.city_slug,
          is_published: item.is_published,
          is_featured: item.is_featured,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      const { error } = await supabase.from('cultural_news').insert({
        ...item,
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`❌ Eklenemedi [${item.slug}]:`, error.message);
      } else {
        console.log(`✅ Eklendi: ${item.title.slice(0, 45)}...`);
      }
    }
  }

  console.log("\n🎉 Tüm örnek kültür-sanat haberleri başarıyla canlı veritabanına aktarıldı!");
}

main().catch(console.error);
