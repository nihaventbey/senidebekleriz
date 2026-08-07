import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sagalassosUltraContent = `# Sagalassos Antik Kenti: Toroslar'ın Aşk Şehri ve Antoninler Çeşmesi Detaylı Gezi Rehberi

Burdur'un Ağlasun ilçesinde Toros Dağları'nın dik yamaçlarında, deniz seviyesinden 1.450 ile 1.700 metre yükseklikte konumlanan Sagalassos Antik Kenti, "Bulutların Üstündeki Şehir" ve "İmparatorların Favori Kenti" unvanlarıyla Akdeniz ile İç Anadolu'nun kesişimindeki Pisidya bölgesinin en görkemli yerleşimidir.

![Sagalassos Antik Kenti Genel Manzarası](https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop)

---

## 1. Sagalassos'un Derin Tarihi ve Büyük İskender'in Kuşatması

Sagalassos bölgesindeki ilk insan yerleşimi izleri günümüzden 12.000 yıl öncesine kadar uzanmaktadır. Ancak kentin gerçek tarihsel dönüm noktası M.Ö. 333 yılında Büyük İskender'in Pers İmparatorluğu'nu yıkmak üzere çıktığı Asya Seferi sırasında yaşanmıştır.

Sagalassos halkı, Toros Dağları'nın sarp yamaçlarında yaşamanın getirdiği avantajla antik dünyanın en savaşçı topluluklarından biri olarak tanınıyordu. Büyük İskender, kenti ele geçirebilmek için ordusunu zorlu dağ tırmanışına sokmak zorunda kalmış ve tarihe geçen çetin bir savaşın ardından kenti fethedebilmiştir. İskender'den sonra Seleukos ve Bergama Krallıklarının kontrolüne giren şehir, M.Ö. 25 yılında Roma İmparatorluğu'na bağlanmıştır.

Roma İmparatoru Hadrianus döneminde (M.S. 117-138) Sagalassos, Pisidya eyaletinin resmi dini ve idari merkezi ilan edilerek altın çağını yaşamıştır.

---

## 2. Antoninler Çeşmesi: Binlerce Yıl Sonra Şırıl Şırıl Akan Mimari Şaheser

Sagalassos denildiğinde akla gelen ilk anıt yapı, Yukarı Agora'nın kuzeyinde yükselen **Antoninler Çeşmesi**'dir. M.S. 160-180 yılları arasında Roma İmparatoru Marcus Aurelius döneminde inşa edilen bu anıtsal çeşme, zarafeti ve taş işçiliğiyle dünya mimarlık tarihinin incisidir.

![Antoninler Çeşmesi](https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop)

### Antoninler Çeşmesi'nin Öne Çıkan Özellikleri:
- **3.500 Parçalık Akılalmaz Restorasyon:** Belçikalı Arkeolog Prof. Dr. Marc Waelkens liderliğindeki uluslararası kazı ekibinin 20 yılı aşkın titiz çalışmaları sonucu, depremlerle yıkılan çeşmenin 3.500'den fazla orijinal mermer parçası tespit edilerek tek tek yerine yerleştirilmiştir.
- **Orijinal Dağ Suyu:** Dünyada binlerce yıl önceki antik dağ kaynağından gelen şifalı suyun tekrar akıtıldığı ender yapılardandır. Çeşmenin havuzunda suyun şırıltısını dinlemek büyüleyici bir deneyim sunar.
- **Dionysos Heykelleri:** Çeşmenin sağ ve sol nişlerinde şarap ve eğlence tanrısı Dionysos'a ait görkemli mermer heykeller yer almaktadır.

---

## 3. Devasa İmparator Heykelleri ve Burdur Müzesi Bağlantısı

Sagalassos'taki anıtsal Roma Hamamı kazılarında, Roma tarihinin en güçlü imparatorlarına ait 5 metreyi bulan devasa mermer heykeller keşfedilmiştir.

### Keşfedilen Başyapıtlar:
- **İmparator Hadrianus Heykeli:** Mermerden işlenmiş devasa bacak ve baş parçaları, antik çağ heykelciliğinin detay anatomisini gözler önüne serer.
- **İmparator Marcus Aurelius Heykeli:** İmparatorun göz bebeği detaylarına kadar incelikle işlenmiş portre başı.
- **İmparator Kraliçesi Faustina:** İmparatoriçeye ait büst ve saç detayları.

*Not: Bu devasa heykellerin orijinalleri günümüzde **Burdur Arkeoloji Müzesi**'nde özel bir salonda sergilenmektedir. Sagalassos gezinizi Burdur Müzesi ile tamamlamanız şiddetle tavsiye edilir.*

---

## 4. Sagalassos'ta Görülmesi Gereken Diğer Anıtsal Yapılar

1. **Dünyanın En Yüksek Antik Tiyatrosu:** Deniz seviyesinden 1.600 metre yükseklikte inşa edilen 9.000 kişilik tiyatro, arkasındaki muhteşem Toros Dağları manzarasıyla antik dünyanın en yüksek tiyatrosudur.
2. **Yukarı ve Aşağı Agora:** Şehrin ticari, hukuki ve sosyal hayatının aktığı mermer kaplı meydanlar.
3. **Heroon Anıtı:** Şehrin kurucu kahramanları adına inşa edilmiş, etrafı dans eden kızlar kabartmalarıyla (Frizler) süslü anıt yapı.
4. **Neon Kütüphanesi:** M.S. 120 yılında Titus Flavius Severianus Neon tarafından yaptırılan ve zemin mozaikleri mükemmel korunan antik kütüphane.
5. **Kaya Mezarları ve Nekropol:** Kentin girişinde sarp kayalara oyulmuş aile mezarları.

---

## 5. Ziyaretçi Rehberi, Ulaşım ve Pratik Bilgiler

- **Sagalassos Nerededir?:** Burdur'un Ağlasun ilçesinde yer alır. Burdur kent merkezine 33 km, Isparta'ya 40 km, Antalya'ya ise yaklaşık 110 km mesafededir.
- **Nasıl Gidilir?:** Burdur veya Isparta otogarlarından Ağlasun ilçesine kalkan minibüslerle ulaşabilirsiniz. Ağlasun ilçe merkezinden antik kente 7 km'lik asfalt bir dağ yolu tırmanılmaktadır.
- **Müze Kart Geçerli mi?:** Evet, Kültür ve Turizm Bakanlığı'na bağlı olan Sagalassos ören yerinde Müze Kart geçerlidir.
- **En İdeal Ziyaret Zamanı:** Rakımı yüksek olduğu için yaz aylarında bunaltıcı sıcaklardan uzaktır. Mayıs-Ekim ayları arası ziyaret için en ideal dönemdir.
- **Yöresel Lezzetler:** Gezi sonrası Ağlasun ilçesinde yöresel alabalık tesislerinde yemek mola verebilirsiniz.`;

async function main() {
  console.log("🚀 Articles data updating to ultra-rich longform...\n");

  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  const rawData = await fs.readFile(jsonPath, "utf-8");
  const articles = JSON.parse(rawData);

  // Find and update Sagalassos
  const index = articles.findIndex((a: any) => a.slug === "sagalassos-antik-kenti-burdur");
  if (index !== -1) {
    articles[index].content = sagalassosUltraContent;
    articles[index].excerpt = "Burdur Ağlasun'da 1.500 metre yükseklikte Toros Dağları'nda yer alan Sagalassos Antik Kenti, Antoninler Çeşmesi ve imparator heykelleri ile detaylı rehber.";
  }

  await fs.writeFile(jsonPath, JSON.stringify(articles, null, 2), "utf-8");
  console.log("✅ data/articles.json updated!");

  // Now push to Supabase
  let count = 0;
  for (const article of articles) {
    const payload = {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      cover_image: article.cover_image,
      city_slug: article.city_slug,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      is_published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("articles")
      .upsert(payload, { onConflict: "slug" });

    if (!error) count++;
  }

  console.log(`🎉 ${count} articles updated in Supabase!`);
}

main().catch(console.error);
