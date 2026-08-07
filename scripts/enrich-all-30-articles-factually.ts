import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Article {
  title: string;
  slug: string;
  excerpt: string;
  city_slug: string;
  meta_title: string;
  meta_description: string;
  cover_image: string;
  content: string;
}

const customFactualArticles: Record<string, string> = {
  "efes-antik-kenti-ve-celsus-kutuphanesi": `# Efes Antik Kenti: İyonya'nın Görkemli Başkenti ve Celsus Kütüphanesi

İzmir'in Selçuk ilçesi sınırları içinde yer alan Efes Antik Kenti, Klasik Yunan, Roma ve Erken Hristiyanlık dönemlerinin Doğu Akdeniz'deki en önemli liman metropolüdür. M.Ö. 6000 yıllarına uzanan köklü tarihiyle Efes, UNESCO Dünya Mirası Listesi'nde yer alan dünyaca ünlü bir kültür hazinesidir.

![Efes Antik Kenti Celsus Kütüphanesi](https://images.unsplash.com/photo-1599818816930-b99b552aa2c7?q=80&w=1200&auto=format&fit=crop)

---

## Antik Dünyanın Mimarisi ve Anıtsal Eserleri

### 1. Celsus Kütüphanesi: Antik Çağın Mimari Şaheseri
M.S. 114 yılında Roma Asya Eyaleti Valisi Tiberius Julius Celsus Polemaeanus anısına oğlu tarafından yaptırılan kütüphane, antik dünyanın İskenderiye ve Bergama'dan sonraki en büyük 3. kütüphanesidir. 

İki katlı görkemli mermer ön cephesinde yer alan 4 heykel antik Roma erdemlerini simgeler:
- **Sophia:** Akıl ve Bilgelik
- **Arete:** Erdem ve Ahlak
- **Ennoia:** Düşünce ve İrade
- **Episteme:** Bilgi ve Bilim

---

### 2. Efes Büyük Tiyatrosu: 25 Bin Kişilik Akustik Harikası
Panayır Dağı yamaçlarına kurulan tiyatro, 25.000 kişilik kapasitesiyle antik dünyanın en büyük açık hava tiyatrolarından biridir. Sadece tiyatro oyunları değil, gladyatör dövüşleri de burada yapılmıştır. Ayrıca İncil'de Aziz Pavlus'un Hristiyanlığı yaymak için vaaz verdiği mekan olarak büyük dinsel öneme sahiptir.

---

### 3. Yamaç Evler (Roma Zenginlerinin Konutları)
Bülbül Dağı yamaçlarında yer alan bu lüks konut kompleksi, antik Roma elitlerinin yaşam tarzını gözler önüne serer. Zeminleri göz alıcı mozaiklerle, duvarları mitolojik fresklerle kaplı olan evlerde merkezi tabandan ısıtma (hipokost) sistemi ve sıcak-soğuk su tesisatı bulunmaktadır.

---

### 4. Hadrian Tapınağı ve Kuretler Caddesi
Kentin ana caddesi olan Kuretler Caddesi üzerinde yükselen Hadrian Tapınağı, ön cephe kemerindeki Şans Tanrıçası Tyche ve Medusa kabartmalarıyla Efes'in en zarif yapılarındandır.

---

## Selçuk ve Efes Gezi Rehberi
- **Giriş ve Ulaşım:** Efes'in Üst Kapı (Magnesia) ve Alt Kapı olmak üzere iki girişi vardır. Üst kapıdan girip aşağı doğru yürümek yokuş aşağı konforlu bir gezi yapmanızı sağlar.
- **Müze Kart:** Efes ören yerinde Müze Kart geçerlidir. Yamaç Evler bölümü koruma altında olduğu için ek biletle gezilmektedir.
- **Yakın Rotalar:** Efes gezinizi Selçuk kent merkezindeki **Meryem Ana Evi**, **St. Jean Bazilikası** ve **Efes Müzesi** ile birleştirebilirsiniz.`,

  "pamukkale-ve-hierapolis-antik-kenti": `# Pamukkale ve Hierapolis: Beyaz Cennetin Antik Termal Mirası

Denizli kent merkezine 18 kilometre mesafede bulunan Pamukkale, doğanın jeolojik harikası ile antik çağın şifa kentini aynı coğrafyada buluşturan dünyada eşi benzeri olmayan bir UNESCO Dünya Mirası alanıdır.

![Pamukkale Traverten Terasları](https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=1200&auto=format&fit=crop)

---

## Traverten Teraslarının Oluşum Mucizesi

Pamukkale travertenleri, yer altından çıkan 35°C sıcaklığındaki kalsiyum hidrokarbonat bakımından zengin termal suların sonucudur. Su yüzeye ulaştığında içindeki karbondioksit gazı uçar ve geriye kalan kalsiyum karbonat çökeler. Yüzyıllar boyunca katman katman biriken bu mineral çökelti, pamuk beyazlığında traverten teraslarını ve doğal havuzları oluşturur.

---

## Hierapolis Antik Kenti: Kutsal Şehir

M.Ö. 2. yüzyılda Bergama Kralı II. Eumenes tarafından kurulan Hierapolis, antik dünyada şifalı termal sularıyla tanınan büyük bir sağlık ve kehanet merkeziydi.

### Hierapolis'te Mutlaka Görülmesi Gerekenler:
1. **Hierapolis Antik Tiyatrosu:** M.S. 2. yüzyılda İtalyan mimarlar tarafından inşa edilen tiyatro, sahne binası ve üzerindeki mitolojik kabartmalarıyla antik dünyanın en iyi korunan yapıları arasındadır.
2. **Kleopatra (Antik) Havuzu:** M.S. 7. yüzyıldaki depremde tarihi sütunların termal havuzun içine devrilmesiyle oluşan doğal akvaryum. Günümüzde şifalı sıcak suda antik mermer sütunlar arasında yüzebilirsiniz.
3. **Plutonium (Cehennem Kapısı):** Yeraltından zehirli gazların (CO2) çıktığı ve antik çağda Yeraltı Tanrısı Hades'e geçiş kapısı sayılan tapınak alanı.
4. **Anıtsal Nekropol:** 2 kilometreden fazla alana yayılan ve 1200'den fazla lahit ve tümülüs mezara ev sahipliği yapan Anadolu'nun en büyük antik mezarlığı.

---

## Ziyaret Rehberi ve İpuçları
- **Traverten Yürüyüşü:** Travertenlerin korunması amacıyla belirli alanlara ayakkabısız girmek zorunludur. Yanınızda ayakkabı çantası bulundurmanız faydalı olacaktır.
- **En İyi Fotoğraf Zamanı:** Gün batımına doğru güneş ışıklarının beyaz travertenlere yansıdığı kızıl saatler en güzel fotoğrafları sunar.`,

  "sumela-manastiri-trabzon-rehberi": `# Sumela Manastırı: Karadeniz'in Kayalara Oyulmuş İnanç Mabedi

Trabzon'un Maçka ilçesindeki Altındere Vadisi'ne hakim Karadağ'ın sarp kayalıkları üzerinde, vadiden 300 metre yükseklikte kurulan Sümela Manastırı (Meryem Ana Manastırı), insan zekasının ve inancının doğayla buluştuğu dünyadaki en etkileyici yapılardan biridir.

![Trabzon Karadeniz Doğa Manzarası](https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop)

---

## 1600 Yıllık Kuruluş Efsanesi

Halk arasında 'Meryem Ana' adıyla anılan manastırın temelleri M.S. 386 yılında atılmıştır. Efsaneye göre Atina'dan gelen Barnabas ve Sophranios adındaki iki rahip, rüyalarında Hz. Meryem'i ve kucağındaki Hz. İsa'yı görmüşler; rüyadaki ikonanın işaret ettiği Karadağ'ın bu sarp kayalık alanına gelerek manastırın çekirdeği olan Kaya Kilisesi'ni inşa etmişlerdir.

---

## Osmanlı Dönemindeki İmtiyazlar ve Fermanlar

Trabzon'un 1461 yılında Fatih Sultan Mehmed tarafından fethedilmesinden sonra Osmanlı padişahları Sümela Manastırı'nın haklarını koruyan fermanlar çıkarmışlardır. Yavuz Sultan Selim, III. Ahmed ve I. Mahmud gibi padişahlar manastıra değerli hediyeler ve şamdanlar bağışlamışlardır.

---

## Manastır Kompleksinin Bölümleri
- **Ana Kaya Kilisesi:** Doğal kaya mağarasının genişletilmesiyle oluşturulan ve duvarları kat kat fresklerle kaplı kutsal alan.
- **Duvar Freskleri:** İncil'den sahnelerin, Hz. İsa'nın hayatının ve kıyamet gününün tasvir edildiği 14. ve 18. yüzyıl duvar resimleri.
- **Kutsal Su (Ayazma):** Kaya yüzeyinden damlayan ve yüzyıllardır şifalı olduğuna inanılan doğal su kaynağı.
- **Misafirhane ve Öğrenci Odaları:** 72 odadan oluşan ve manastır keşişlerinin yaşadığı ahşap bölümler.

---

## Ziyaret Rehberi
- **Ulaşım:** Trabzon merkezden Maçka Altındere Vadisi Milli Parkı'na kalkan tur otobüsleri ile 45 dakikada ulaşabilirsiniz. Araç park yerinden sonra manastıra yürüyüş yolu veya ring servisler ile çıkılmaktadır.`,

  "nemrut-dagi-dev-heykelleri-adiyaman": `# Nemrut Dağı Dev Heykelleri: Kommagene Krallığı'nın Gökyüzü Tapınağı

Adıyaman'ın Kahta ilçesinde 2.150 metre yükseklikte yer alan Nemrut Dağı, antik dünyanın en heybetli anıtsal mezarlarından birine ev sahipliği yapar.

![Nemrut Dağı Heykelleri](https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop)

---

## Kral I. Antiochos ve Tümülüs Mimarisi

M.Ö. 1. yüzyılda Kommagene Kralı I. Antiochos, atasal soylarını (Pers ve Yunan) ölümsüzleştirmek için bu anıtsal kompleksi inşa ettirmiştir. Tümülüsün Doğu ve Batı teraslarında devasa tahtlarda oturan Zeus, Apollo, Herakles ve Kommagene tanrıça heykelleri yer alır.

Nemrut Dağı kırma taşlardan oluşan 50 metre yüksekliğindeki anıt mezar tümülüsü ile çevrilidir. Heykellerin kafaları depremler ve doğa şartlarıyla gövdelerinden ayrılmış ve teras zeminine yerleştirilmiştir.

---

## Zirvede Gün Doğumu ve Gün Batımı

Nemrut Dağı, dünyada gün doğumu ve gün batımının en büyüleyici izlendiği zirvelerdendir. Güneş ışıklarının ilk olarak Doğu terasındaki taş tanrı heykellerine vurması anı unutulmaz bir manzaradır.

### Adıyaman Kültür Rotası:
- **Arsemia Antik Kenti:** Kommagene krallarının yazlık başkenti.
- **Cendere Köprüsü:** Roma İmparatoru Septimius Severus adına inşa edilen tarihi kemer köprü.
- **Karakuş Tümülüsü:** Kommagene kraliyet kadınlarının anıt mezarı.`
};

async function updateFactuals() {
  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const articles: Article[] = JSON.parse(raw);

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    if (customFactualArticles[art.slug]) {
      art.content = customFactualArticles[art.slug];
      console.log(`✅ Updated factual content for ${art.slug} (${art.content.length} chars)`);
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(articles, null, 2), "utf-8");
  console.log("\n🎉 Articles updated and saved to data/articles.json");

  let successCount = 0;
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

    if (!error) successCount++;
  }

  console.log(`🎉 ${successCount} articles updated in Supabase database!`);
}

updateFactuals().catch(console.error);
