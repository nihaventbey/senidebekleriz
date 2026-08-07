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

const sinopFactualContent = `# Sinop Tarihi Cezaevi ve Surları: Karadeniz'in Tarihi Zindanı

Sinop kent merkezinde, Karadeniz'in hırçın dalgalarının dövdüğü tarihi Sinop Kalesi surları içerisinde yükselen **Sinop Tarihi Cezaevi**, Türk edebiyatına ve yakın tarihine damga vurmuş en sarsıcı yapılardan biridir. Üç tarafı denizle çevrili yüksek kale surlarının ardında kurulu olan cezaevi, nemli havası ve aşılması imkansız duvarlarıyla dönemin "Anadolu'nun Alcatraz'ı" olarak anılmıştır.

![Sinop Kalesi ve Tarihi Zindan Surları](https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop)

---

## 1. Antik Surlardan Zindana: Sinop Cezaevi'nin Tarihi

Sinop Cezaevi'nin bulunduğu alan aslında M.Ö. 7. yüzyılda bölgeye yerleşen Miletliler döneminden itibaren savunma amaçlı kullanılan **İç Kale** bölgesidir. Selçuklu Sultanı İzzettin Keykavus'un 1214 yılında şehri fethetmesinden sonra kale güçlendirilmiş, Osmanlı döneminde ise tersane ve mühimmat deposu olarak kullanılmıştır.

1887 yılında Osmanlı Devleti döneminde resmi olarak kapalı cezaevine dönüştürülen yapı, 1999 yılına kadar aralıksız cezaevi olarak hizmet vermiş, bu tarihten sonra müze haline getirilerek ziyarete açılmıştır.

---

## 2. Edebiyatın ve Siyasetin Sürgün Yeri

Sinop Cezaevi sadece mimarisiyle değil, koğuşlarında ağırladığı aydınlar, şairler ve siyasetçilerle de hafızalara kazınmıştır.

### Sabahattin Ali ve "Aldırma Gönül"
Türk edebiyatının usta kalemi **Sabahattin Ali**, 1932-1933 yıllarında bu cezaevinde yatmıştır. Nemli duvarlar ve rüzgar sesleri arasında kaleme aldığı unutulmaz eserler şunlardır:
- **"Aldırma Gönül"** (Dışarıda deli dalgalar / Gelip duvarları yalar...)
- **"Duvar"** şiiri ve ünlü **"Kuyucaklı Yusuf"** romanının taslakları.

Sabahattin Ali'nin kaldığı 1. Kısım 5. Koğuş, günümüzde aslına uygun olarak muhafaza edilmekte ve ziyaretçilerin en çok ilgisini çeken bölüm olmaktadır.

### Cezaevinde Yatan Diğer Ünlü İsimler:
- **Refik Halit Karay** (Milli Mücadele dönemi sürgünü)
- **Mustafa Suphi** ve **Ahmet Bedevi Kuran**
- **Kerim Korcan** ve **Zekeriya Sertel**

---

## 3. Cezaevi Yapısı ve Disiplin Hücreleri

Cezaevi üç ana kısımdan oluşmaktadır:
1. **İç Kale Koğuşları:** Yüksek taş duvarlarla birbirinden ayrılmış geniş avlular.
2. **Disiplin (Tecrit) Hücreleri:** Işık almayan, rutubetli ve mahkumların ceza olarak kapatıldığı dar taş odalar.
3. **Gözetleme Kuleleri ve Surlar:** Nöbetçi gardiyanların kaleyi 24 saat kontrol altında tuttuğu tarihi kale burçları.

---

## 4. Sinop Ziyaret Rehberi ve Çevre Gezi Noktaları

- **Nasıl Gidilir?:** Sinop kent merkezinde yer aldığı için liman ve yürüyüş caddesinden yürüyerek kolayca ulaşılabilir.
- **Müze Kart:** Kültür ve Turizm Bakanlığı'na bağlı olan Sinop Tarihi Cezaevi'nde Müze Kart geçerlidir.
- **Gezi Sonrası Rota:** Cezaevi gezisi sonrası Sinop Sahili'nde meşhur **Sinop Mantısı** yiyebilir, Türkiye'nin tek fiyordu olan **Hamsilos Fiyordu** ve **İnceburun Deniz Feneri**'ni gezebilirsiniz.`;

const divrigiFactualContent = `# Sivas Divriği Ulu Camii ve Darüşşifası: Taşın Şiire Dönüştüğü Anıt

Sivas'ın Divriği ilçesinde 1228 yılında inşa edilen **Divriği Ulu Camii ve Darüşşifası**, İslam mimarisinin ve Anadolu Selçuklu taş işçiliği sanatının dünyadaki en görkemli şaheseridir. UNESCO tarafından 1985 yılında Türkiye'den Dünya Kültür Mirası Listesi'ne alınan **ilk mimari yapı** olma gururunu taşımaktadır.

![Divriği Ulu Camii Selçuklu Taş Mimarisi](https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop)

---

## 1. Mengücekli Beyliği ve Kurucuları

Eser, Anadolu Selçuklu Devleti'ne bağlı Mengücekli Beyliği döneminde yaptırılmıştır. 
- **Cami Bölümü:** Mengücek Hükümdarı **Süleyman Şah oğlu Ahmet Şah** tarafından 1228 yılında yaptırılmıştır.
- **Darüşşifa (Hastane) Bölümü:** Ahmet Şah'ın eşi, Behram Şah'ın kızı **Turan Melek Hanım** tarafından aynı tarihte inşa ettirilmiştir.

Yapının baş mimarı Ahlatlı **Hürremşah**'tır. Mimar Hürremşah, taş üzerine işlediği binlerce motifin hiçbirini birbiriyle tekrarlamayarak antik dünyanın en büyüleyici simetrik ve 3 boyutlu kabartma sanatını sergilemiştir.

---

## 2. Taş Kapılardaki Mucize: Namaz Kılan İnsan Gölgesi

Divriği Ulu Camii'nin en şaşırtıcı özelliği, Mayıs ile Eylül ayları arasında ikindi vaktine doğru Batı Kapısı (Cennet Kapısı) üzerinde beliren doğa ve mimari mucizesidir. 

Güneş ışıklarının kapıdaki taş kabartmalara belirli açıyla vurmasıyla, kapı üzerinde **namaz kılan bir erkek gölgesi** oluşmaktadır. Bu durum Selçuklu mimarlarının sadece taş işçiliğinde değil, astronomi ve açı fiziğinde de ne kadar ileri seviyede olduklarını kanıtlamaktadır.

---

## 3. Anıtsal Taç Kapılar

Yapının her biri sanat eseri niteliğinde 4 ana kapısı vardır:
1. **Cennet Kapısı (Kuzey Taç Kapı):** Üzerindeki hayat ağacı, geometrik desenler ve kazan kulpu motifleriyle cennet tasvirini yansıtır.
2. **Batı Kapı (Tekstil Kapısı):** İnce dantel gibi işlenmiş motifleriyle kumaş deseni hissi uyandırır.
3. **Şah Kapısı:** Padişah ve hükümdarın camiye girişi için tasarlanmış daha mütevazı kapı.
4. **Darüşşifa Taç Kapısı:** Gotik ve Selçuklu tarzının harmanlandığı hastane girişi.

---

## 4. Darüşşifa'da Su Sesli ve Müzikli Tedavi

Camiye bitişik olarak inşa edilen Darüşşifa, döneminin en gelişmiş tıp merkezlerinden biriydi. Akıl ve ruh hastalarının tedavisinde ilaç yerine **su sesi, tasavvuf müziği ve kuş sesleri** kullanılmıştır. Darüşşifa'nın ortasındaki kubbeli avluda yer alan havuz sistemi, çıkan su sesinin akustik olarak oda ve hücrelere yayılmasını sağlamaktadır.

---

## 5. Ziyaretçi Rehberi

- **Sivas Divriği'ye Ulaşım:** Sivas kent merkezine yaklaşık 170 km mesafededir. Sivas otogarından kalkan Divriği otobüsleri veya **Doğu Ekspresi** treni ile Divriği istasyonunda inerek ulaşabilirsiniz.
- **Restorasyon Detayı:** T.C. Vakıflar Genel Müdürlüğü tarafından yürütülen kapsamlı restorasyon çalışmaları tamamlanmış olup yapı ziyaretçilerini ağırlamaktadır.`;

async function cleanApp() {
  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const articles: Article[] = JSON.parse(raw);

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];

    // Clean up Sinop and Sivas Divrigi specifically
    if (art.slug === "sinop-tarihi-cezaevi-ve-sinop-kalesi") {
      art.content = sinopFactualContent;
      art.cover_image = "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop";
    }

    if (art.slug === "sivas-divrigi-ulu-camii-ve-darussifikasi") {
      art.content = divrigiFactualContent;
      art.cover_image = "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop";
    }

    // Strip any generic boilerplate templates from any article
    art.content = art.content.replace(/## Kapsamlı Tarihçe, Arkeolojik Değer ve Mimari Yapı[\s\S]*$/g, "");
    art.content = art.content.trim();
  }

  fs.writeFileSync(jsonPath, JSON.stringify(articles, null, 2), "utf-8");
  console.log("✅ Cleaned articles written to data/articles.json");
}

cleanApp().catch(console.error);
