import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MasterworkArticle {
  slug: string;
  title: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  cover_image: string;
  content: string;
}

const MASTERWORK_ARTICLES: Record<string, Partial<MasterworkArticle>> = {
  "gobeklitepe-tarihin-sifir-noktasi": {
    content: `# Göbeklitepe: Tarihin Sıfır Noktası ve İnsanlık Tarihini Değiştiren Neolitik Devrim

Şanlıurfa kent merkezine yaklaşık 18 kilometre uzaklıkta, Harran Ovası'na hakim Örencik Köyü yakınlarındaki kireçtaşı platosunda yükselen Göbeklitepe, arkeoloji ve insanlık tarihinde son yüzyılın en sarsıcı keşfidir. Günümüzden yaklaşık 11.500 - 12.000 yıl önce (M.Ö. 9600-9500, Çanak Çömleksiz Neolitik A ve B evreleri) inşa edilen bu anıtsal inanç merkezi; İngiltere'deki Stonehenge'den 6.000 yıl, Mısır Gize Piramitleri'nden ise tam 7.000 yıl daha eskidir.

![Göbeklitepe T Stelleri ve Megalitik Tapınak Alanı](https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1200&auto=format&fit=crop)

---

## Neolitik Devrimin Ezber Bozan Yeni Paradigması

Alman Arkeolog Prof. Dr. Klaus Schmidt liderliğinde 1995 yılında başlayan sistemli kazılardan önce, klasik arkeoloji ve antropolojide Gordon Childe kökenli yerleşik teori şuydu: İnsanlar önce iklim değişikliğiyle tarımı keşfetmiş, yabani tahılları ve hayvanları evcilleştirmiş, köyler kurup yerleşik hayata geçmiş; iş bölümü ve artı ürünün ortaya çıkmasıyla birlikte tapınaklar ve din adamları sınıfı doğmuştu.

Ancak Göbeklitepe bu sıralamayı kökünden sarstı. Henüz yerleşik köy hayatına tam geçmemiş, çanak çömlek yapmayı bilmeyen ve geçimini yalnızca avcılık ve yabani toplayıcılıkla sağlayan insan topluluklarının yüzlerce kilometre uzaktan bir araya gelerek Göbeklitepe'yi inşa ettiği anlaşıldı. **Bu devrim niteliğindeki kanıt gösterdi ki; insanları organize eden, yüzlerce işçiyi aylarca ortak bir hedefe sevk eden ve nihayetinde yerleşik tarım toplumuna geçişi tetikleyen ana dinamik inanç, ritüel ve ortak toplanma ihtiyacı olmuştur.**

---

## T Biçimli Monolitik Dikilitaşlar ve Taş İşçiliği Mühendisliği

Göbeklitepe'de çapları 10 ila 30 metre arasında değişen anıtsal dairesel ve oval megalitik tapınak yapıları (arkeolojide A, B, C, D yapıları olarak adlandırılan alanlar) yer alır. Her yapının merkezinde, yüzleri birbirine bakan yaklaşık 5.5 - 6 metre yüksekliğinde ve ağırlığı 16 tona kadar ulaşan iki büyük 'T' biçimli dikilitaş (stel) yükselmektedir.

Dikilitaşlar iddia edildiği gibi mermer değil; **bölgenin doğal jeolojik yapısını oluşturan kireçtaşı (limestone) ana kayasından çakmaktaşı (obsidyen ve sileks) aletlerle kesilip oyulmuştur.**

### Stellerin İkonografik ve Sembolik Anatomisi:
1. **Stilize İnsan Figürleri:** 'T' biçiminin yatay üst bloğu insan başını, dikey gövde ise insan bedenini temsil eder. Stellerin dar yan yüzlerinde insan kolları, parmakları, göbek hizasında bağlanan kemer tokaları ve tilki postundan peştamal kabartmaları açıkça seçilmektedir.
2. **Yırtıcı Faunaya Dayalı Kabartma Sanatı:** Taş yüzeylere oyulmuş tilki, yaban domuzu, aslan/leopar, turna kuşu, akbaba, boğa ve yılan figürleri yüksek kabartma (haut-relief) ustalığıyla işlenmiştir. Birçok stelde hayvanlar saldırıya hazır, dişlerini gösteren koruyucu bekçiler olarak konumlandırılmıştır.
3. **Mitolojik ve Kozmik Sembolizm:** D yapısındaki merkez stellerin göğsünde yer alan 'H' ve hilal-yıldız benzeri semboller, Neolitik kozmolojinin, gök cisimlerinin veya klan simgelerinin yansıması olarak yorumlanmaktadır.

---

## Taş Tepeler Projesi ve Karahantepe Entegrasyonu

Göbeklitepe tekil ve izole bir tapınak değildir. T.C. Kültür ve Turizm Bakanlığı ile Prof. Dr. Necmi Karul koordinasyonunda yürütülen **Taş Tepeler Projesi**; Karahantepe, Sayburç, Çakmaktepe, Sefertepe ve Harbetsuvan gibi Şanlıurfa platosundaki 12 ayrı Neolitik merkezi birbirine bağlamaktadır. Karahantepe'de bulunan fallik sütunlu tören salonları ve gerçekçi insan büstleri, bu coğrafyanın 11 bin yıl önceki entelektüel ve artistik derinliğini tescillemektedir.

---

## Ziyaret Rehberi ve Kültür Rotası
- **Müze Entegrasyonu:** Göbeklitepe ören yerini gezdikten sonra Şanlıurfa kent merkezindeki **Şanlıurfa Arkeoloji Müzesi**'ni mutlaka ziyaret edin. D yapısının birebir replikası ve Neolitik döneme ait dünyaca ünlü "Urfa Adamı" (Balıklıgöl Heykeli) bu müzede sergilenmektedir.
- **Ziyaret Koşulları:** Ören yeri devasa membran koruma çatısıyla örtülüdür. Yaz aylarında sıcaklık 40°C'yi aştığından sabahın ilk saatleri veya gün batımına yakın saatler ziyaret için en elverişli zaman dilimidir.`
  },

  "ani-harabeleri-kars-tarihi": {
    content: `# Ani Harabeleri: Binbir Kiliseli Kars Antik Kenti ve İpek Yolu Mirası

Kars kent merkezine 42 kilometre uzaklıkta, Türkiye-Ermenistan sınırını çizen Arpaçay Kanyonu'nun sarp kayalıkları üzerinde yükselen Ani Harabeleri, Orta Çağ Kafkasyası ve Anadolu'sunun en görkemli ticaret, kültür ve inanç metropolüdür. M.S. 10. ve 11. yüzyıllarda Bagratuni Krallığı'nın başkenti olan ve "1001 Kiliseli Şehir" ya da "40 Kapılı Kent" olarak anılan Ani, 2016 yılında UNESCO Dünya Mirası Listesi'ne tescil edilmiştir.

![Ani Harabeleri Katedral ve Surlar](https://images.unsplash.com/photo-1578922746465-3a80a228f229?q=80&w=1200&auto=format&fit=crop)

---

## İpek Yolu'nun Kafkasya Kapısı ve Medeniyetlerin Harmanı

Ani'yi sıradan bir antik kentten ayıran en önemli unsur, İpek Yolu'nun kuzey kolu üzerinde Doğu ile Batı'nın, Hristiyan ile İslam mimarisinin kesiştiği çok katmanlı bir laboratuvar olmasıdır. Ani; Ermeni kralları, Bizans valileri, Selçuklu sultanları, Şeddadi emirleri ve Gürcü atabeyleri tarafından art arda yönetilmiş; her medeniyet kentin anıtsal siluetine kendi taş imzasını bırakmıştır. Kars'ın meşhur volkanik bazalt ve kırmızı-siyah tüf taşından inşa edilen yapılar, aradan geçen bin yıla ve yıkıcı depremlere rağmen zamana meydan okumaktadır.

---

## Ani'de Mutlaka Görülmesi Gereken Anıtsal Başyapıtlar

### 1. Ani Katedrali (Meryem Ana Kilisesi / Fethiye Camii)
Orta Çağ mimarlık tarihinin en büyük dehalarından **Mimar Trdat** (İstanbul'daki Ayasofya'nın depremde çöken kubbesini de onaran mimar) tarafından 989-1001 yılları arasında inşa edilmiştir. Katedral, Avrupa'da ortaya çıkacak Gotik mimariden yüzyıllar önce sivri kemerleri, küme ayakları ve dikey hatlarıyla proto-Gotik bir devrim olarak kabul edilir. Sultan Alparslan'ın 1064'te Ani'yi fethinin ardından yapı **Fethiye Camii** adıyla camiye çevrilmiş ve Anadolu'da fetih namazı kılınan ilk anıtlardan biri olmuştur.

### 2. Menuçehr Camii: Anadolu'nun İlk Türk Camisi
1072 yılında Selçuklulara bağlı Şeddadoğulları emiri Menuçehr tarafından yaptırılan cami, **Anadolu coğrafyasında Türkler tarafından inşa edilen en eski cami** unvanına sahiptir. Arpaçay Kanyonu'na bakan geniş pencereleri, sekizgen minaresi ve iç mekanda kırmızı-siyah tüf taşlarıyla oluşturulmuş geometrik tavan tonozları Selçuklu taş işçiliğinin şaheseridir.

### 3. Tigran Honents Kilisesi (Resimli Kilise)
1215 yılında zengin tüccar Tigran Honents tarafından yaptırılan kilise, Arpaçay vadisine hakim dik bir yamaçta yer alır. Yapının iç duvarları ve kubbesi, Erken Hristiyanlık tarihini, İsa Peygamber'in mucizelerini ve Ermenilere Hristiyanlığı getiren Aziz Aydınlatıcı Krikor'un yaşamını betimleyen olağanüstü zengin fresklerle kaplıdır.

### 4. Gagik Kilisesi ve Aziz Pırgiç (Karasun Manuk)
Aziz Pırgiç Kilisesi, 1957 yılındaki fırtınada yıldırım düşmesi sonucu tam ortadan ikiye ayrılmış dramatik siluetiyle Ani'nin simgelerinden biridir. Kubbesindeki 19 havari freskleri ve dairesel planı dönemin yüksek mühendislik seviyesini yansıtır.

---

## Mimari Özellikler ve Kars Kültür Rotası
- **İpek Yolu Taş Köprüsü:** Arpaçay Kanyonu'nun dibinde iki ülkeyi birbirine bağlayan köprünün devasa taş ayakları bugün hala nehri selamlamaktadır.
- **Kars Taş Mimarisi:** Ani gezinizi Kars kent merkezindeki **Kars Kalesi**, **Havariler Kilisesi (Kümbet Camii)** ve 19. yüzyıl Baltık mimarisinin izlerini taşıyan Rus taş konakları ile birleştirebilirsiniz.
- **Ziyaret İpuçları:** Ani geniş bir ovaya yayılmıştır; tüm anıtları hakkıyla yürüyerek görmek en az 3-4 saat sürer. Kışın bembeyaz kar örtüsü altında, baharda ise yeşil bozkır çiçekleri arasında masalsı bir atmosfer sunar.`
  },

  "catalhoyuk-neolitik-kenti-konya": {
    content: `# Çatalhöyük Neolitik Kenti: İnsanlığın İlk Şehirleşme ve Eşitlikçi Toplum Deneyi

Konya kent merkezine 52 kilometre mesafede, Çumra ilçesi sınırları içindeki verimli Konya Ovası'nda yer alan Çatalhöyük Neolitik Kenti, insanlık tarihinde avcı-toplayıcılıktan karmaşık kentsel yaşama geçişin dünyadaki en eksiksiz ve en iyi korunmuş tanığıdır. M.Ö. 7400 ile M.Ö. 6200 yılları arasına tarihlenen Çatalhöyük, 2012 yılında UNESCO Dünya Mirası Listesi'ne dahil edilmiştir.

![Çatalhöyük Kerpiç Ev Modeli ve Kazı Alanı](https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop)

---

## 8 Bin İnsanın Sokaksız ve Savaşsız Birlikte Yaşamı

Çatalhöyük, Doğu ve Batı olmak üzere iki ayrı höyükten oluşur. En parlak döneminde 8.000'i aşkın insanın aynı anda yaşadığı tahmin edilen Doğu Höyüğü'nde dünya şehircilik tarihinde eşi benzeri olmayan bir kentsel düzen mevcuttu:

1. **Sokaksız Kent Mimarisi:** Çatalhöyük'te sokak veya cadde kavramı yoktu. Evler birbirine bitişik nizamda, kalın kerpiç duvarlarla inşa edilmişti. İnsanlar şehir içi ulaşımı düz damlar üzerinden sağlıyordu.
2. **Çatıdan Girişli Yaşam Alanları:** Evlerin kapısı veya dışa bakan penceresi bulunmazdı. Her evin çatısında bir ahşap merdiven açıklığı vardı; evin havalandırması, ocağın duman tahliyesi ve giriş-çıkışı bu çatı kapağından yapılıyordu. Bu mimari tercih hem vahşi hayvanlara hem de dış tehditlere karşı kusursuz bir savunma kalkanı oluşturuyordu.
3. **Eşitlikçi (Egaliter) Toplum Düzeni:** Çatalhöyük'te saray, tapınak, yönetici köşkü veya askeri kışla gibi sınıfsal farkları gösteren kamusal yapılar bulunmamıştır. Evlerin boyutları, iç donanımları ve mezar hediyeleri neredeyse tamamen birbirine eştir. Arkeolojik veriler cinsiyetler ve bireyler arasında belirgin bir hiyerarşinin olmadığını göstermektedir.

---

## Sembolizm, Sanat ve Ev İçi Ritüeller

İngiliz Arkeolog James Mellaart tarafından 1958'de keşfedilen ve 1990'lardan itibaren Prof. Ian Hodder liderliğindeki uluslararası ekip tarafından kazılan Çatalhöyük, Neolitik sanatın doruk noktasıdır:

- **Bukranya (Boğa Başı Sekileri):** Evlerin iç duvarlarına sıva ile gömülmüş gerçek yaban boğası boynuzları ve kille modellenmiş hayvan başları, evin manevi koruyucusu sayılıyordu.
- **Duvar Resimleri ve Hasan Dağı Manzarası:** Beyaz kireç sıvalı duvarlar üzerine aşı boyasıyla çizilmiş leopar desenleri, dans eden insan figürleri ve av sahneleri yer alır. Kazılarda bulunan ve Çatalhöyük evlerinin arkasında patlayan çift tepeli bir volkanı gösteren fresk, **tarihin ilk haritası ve manzara resmi** kabul edilmektedir (patlayan volkanın 130 km uzaktaki Hasan Dağı olduğu kanıtlanmıştır).
- **Ölü Gömme Geleneği:** Çatalhöyük sakinleri vefat eden aile üyelerini evlerinin tabanındaki oturma ve uyuma sekilerinin altına, ana karnındaki cenin pozisyonunda (hocker) gömerlerdi. Böylece atalarla günlük yaşam arasındaki bağ koparılmazdı.
- **Ana Tanrıça Figürinleri:** İki leopar arasında tahtta oturan dolgun hatlı pişmiş toprak kadın heykeli (Çatalhöyük Ana Tanrıçası), bereketin, doğurganlığın ve yaşam döngüsünün evrensel simgesidir (bugün Ankara Anadolu Medeniyetleri Müzesi'nde sergilenmektedir).

---

## Çatalhöyük Ziyaret Rehberi
- **Korumalı Kazı Alanları:** Çatalhöyük Doğu Höyüğü, kuzey ve güney koruma çatılarıyla ziyaretçilere açıktır. Kazı çukurlarını ve kerpiç duvar kesitlerini ahşap yürüyüş iskelelerinden izleyebilirsiniz.
- **Canlandırma Evi ve Ziyaretçi Merkezi:** Girişteki deneysel kerpiç model evde çatıdan merdivenle inerek 9 bin yıl önceki Neolitik yaşam atmosferini deneyimleyebilirsiniz.
- **Konya Müze Rotası:** Çatalhöyük gezinizi kent merkezindeki **Konya Arkeoloji Müzesi**, **Mevlana Müzesi** ve **Karatay Medresesi Çini Eserler Müzesi** ile taçlandırabilirsiniz.`
  },

  "nemrut-dagi-dev-heykelleri-adiyaman": {
    content: `# Nemrut Dağı Dev Heykelleri: Kommagene Krallığı'nın Gökyüzü Tapınağı ve Aslanlı Horoskop

Adıyaman'ın Kahta ilçesi sınırlarında, Toros Dağları silsilesinin 2.150 metre yüksekliğindeki zirvesinde göğe yükselen Nemrut Dağı, antik dünyanın en görkemli anıtsal mezar kompleksi ve açık hava kutsal alanıdır (Hierothesion). M.Ö. 1. yüzyılda Kommagene Kralı I. Antiochos tarafından hem kendi ebedi istirahatgahı hem de Doğu ile Batı dinlerini birleştiren evrensel bir panteon olarak inşa edilen anıt, 1987 yılında UNESCO Dünya Mirası Listesi'ne alınmıştır.

![Nemrut Dağı Heykelleri Gün Doğumu](https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop)

---

## Kommagene: Helenistik ve Pers Kültürlerinin Mistik Sentezi

M.Ö. 163 - M.S. 72 yılları arasında hüküm süren Kommagene Krallığı; Roma İmparatorluğu ile Part (Pers) İmparatorluğu arasında stratejik bir tampon devletti. Kral I. Antiochos, anne tarafından Büyük İskender'e (Makedon/Helen), baba tarafından ise Pers Krallar Kralı I. Dareios'a (Ahameniş) uzanan soyuyla gurur duyuyordu. Nemrut Dağı'nda yarattığı tanrılar panteonu, Yunan mitolojisindeki panteon ile Zerdüşt Pers inancını aynı bedenlerde kaynaştıran olağanüstü bir teolojik sinkretizmdir.

---

## Tümülüs Mimarisi ve Anıtsal Teraslar

Nemrut Dağı'nın doruğunda, küçük kırma kireçtaşı çakıllarının yığılmasıyla oluşturulmuş 50 metre yüksekliğinde ve 150 metre taban çapında devasa bir tümülüs yer alır. Kral Antiochos'un mezar odasının bu çakıl yığınının altında ana kayaya oyulduğu bilinmektedir; çakılların akma özelliği nedeniyle mezar odasına antik dönemden beri ulaşılamamış ve yağmalanamamıştır. Tümülüsün etrafında üç teras yer alır:

### 1. Doğu Terası: Tanrılar Meclisi
Güneşin doğuşunu karşılayan bu terasta, tahtlarında oturan 8-10 metre yüksekliğinde devasa kireçtaşı heykeller sıralanır (depremler sonucu heykellerin dev başları tahtların önüne yerleştirilmiştir):
- **Koruyucu Aslan:** Yeryüzü egemenliğinin ve Kommagene'nin askeri gücünün simgesi.
- **Koruyucu Kartal:** Gökyüzünün hakimi ve tanrıların habercisi.
- **Kral I. Antiochos:** Tanrılarla aynı sırada, aynı boyutta oturan kral büstü.
- **Kommagene / Tyche:** Krallığın bereketini simgeleyen meyve ve başak taçlı tanrıça.
- **Zeus - Oromasdes (Ahura Mazda):** Panteonun baş tanrısı, evrenin yaratıcısı.
- **Apollon - Mithras - Helios - Hermes:** Güneş, ışık ve adalet tanrılarının birleşimi.
- **Herakles - Artagnes - Ares:** Güç ve cesaret tanrısının Pers ve Yunan sentezi.

### 2. Batı Terası ve Dünyanın En Eski Horoskopu
Güneşin batışına bakan Batı Terası'nda heykellerin yüz hatları rüzgardan daha az aşındığı için portre detayları çok daha canlıdır. Bu terasta yer alan kabartmalar (stel) dünya astronomi tarihi için eşsiz bir hazinedir:
- **Aslanlı Horoskop:** Üzerinde 19 yıldız ve Ay hilali bulunan bir aslan kabartmasıdır. Aslanın sırtında Mars, Merkür ve Jüpiter gezegenleri açıkça tasvir edilmiştir. Astronomi uzmanları bu dizilimin **M.Ö. 7 Temmuz 62** tarihine işaret ettiğini ve Kral Antiochos'un tahta çıkış gününü belgeleyen **tarihin en eski astrolojik gök haritası** olduğunu doğrulamıştır.
- **Dexiosis Kabartmaları:** Kral Antiochos'un tanrılarla (Zeus, Apollon, Herakles) tokalaşmasını tasvir eden kabartmalardır. Kral tanrılardan alçak veya secde halinde değil; eşit bir müttefik gibi göz hizasında tokalaşmaktadır.

---

## Adıyaman Kommagene Kültür Rotası
Nemrut Dağı ziyaretinizi Kahta çevresindeki tarihi Kommagene halkasıyla birleştiriniz:
1. **Karakuş Tümülüsü:** Kommagene kraliyet kadınlarının anıtsal sütunlu mezarı.
2. **Cendere Köprüsü:** Roma İmparatoru Septimius Severus döneminde (M.S. 200 civarı) harçsız kesme taşlarla yapılan ve 1800 yıldır dimdik ayakta duran mühendislik harikası.
3. **Arsemia Ören Yeri:** Krallığın yazlık başkenti; Antiochos-Herakles tokalaşma kabartması ve Anadolu'nun en uzun Grekçe yazıtı burada yer alır.
- **Ziyaret İpucu:** Nemrut Dağı'nda gün doğumu veya gün batımını izlemek eşsiz bir ritüeldir. 2.150 metrede yaz aylarında bile hava sıcaklığı aniden 5-10°C'ye düşebileceğinden kalın giysiler bulundurunuz.`
  },

  "bursa-ulu-camii-ve-cumalikizik-rehberi": {
    content: `# Bursa Ulu Camii ve Cumalıkızık: Erken Osmanlı Dönemi Mimarisi, Şadırvan ve Kündekari Şaheseri

Osmanlı İmparatorluğu'nun ilk payitahtı olan Bursa, beylikten cihan devletine uzanan mimari dönüşümün tüm evrelerini bünyesinde barındırır. Bu mirasın zirve noktası; 1396-1399 yılları arasında Sultan I. Bayezid (Yıldırım) tarafından Niğbolu Zaferi adağı olarak inşa ettirilen **Bursa Ulu Camii** ve 700 yıllık yaşayan Osmanlı vakıf köyü **Cumalıkızık**'tır. Her iki kültür hazinesi de 2014 yılında "Bursa ve Cumalıkızık: Osmanlı İmparatorluğunun Doğuşu" başlığı altında UNESCO Dünya Mirası Listesi'ne kaydedilmiştir.

![Bursa Ulu Camii İç Mekan ve Şadırvan](https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop)

---

## 20 Kubbeli Erken Osmanlı Ulu Cami Tipolojisi

Niğbolu Savaşı öncesinde 20 ayrı cami yaptırmayı adayan Yıldırım Bayezid, zaferin ardından dönemin büyük alimi Emir Sultan'ın tavsiyesiyle 20 kubbeli tek ve muazzam bir ulu mabet yaptırmaya karar vermiştir. Mimar Ali Neccar tarafından tasarlanan yapı, çok kubbeli ve çok ayaklı ulu cami geleneğinin Türk-İslam mimarisindeki en anıtsal örneğidir:

- **Ayak ve Kubbe Mimarisi:** Caminin tavan örtüsü, 12 büyük masif kare ayak (paye) üzerine oturan 20 kubbeden meydana gelir. Orta kubbenin üzerinde açık bir cam fener yer alır.
- **Harim İçi Mermer Şadırvan:** Orta kubbenin tam altında, doğrudan gökyüzünden gelen doğal ışık huzmesinin vurduğu 16 köşeli havuzlu devasa bir mermer şadırvan yer alır. Caminin içinde şırıldayan su sesi, mekanda derin bir sükunet ve akustiğe hayat verir. Suyun iç mekanda bulunması, cami inşa edilmeden önce bu alanda evi bulunan yaşlı bir kadının mülkünü gönülsüz satmak istememesi üzerine, toprağın gasp edilmeyip açık havuz olarak muhafaza edildiği menkıbesine dayanır.

---

## Kündekari Minber: Güneş Sistemi Gezegen Yörüngeleri

Caminin ceviz ağacından yapılan minberi, Manisalı Hacı Mehmed bin Abdülaziz ed-Dukki'nin imzasını taşıyan bir ahşap işçiliği mucizesidir:

1. **Çivisiz ve Tutkalsız Geçme Tekniği:** Minber, binlerce küçük geometrik ahşap parçanın birbirine kündekari (dilimli geçme) tekniğiyle çivi veya yapıştırıcı kullanılmadan birleştirilmesiyle inşa edilmiştir.
2. **Güneş Sistemi Kabartması:** Minberin doğu cephesindeki geometrik kabartma panolarında Güneş ve etrafındaki gezegenler ile cüce gezegenlerin heliosentrik yörüngeleri kabartma kürelerle resmedilmiştir. Kopernik ve Galileo'dan yüzyıllar önce Güneş Sistemi'nin gezegen dizilimini gösteren bu kompozisyon, Erken Osmanlı döneminde matematik ve astronomi ilminin mimari sanata izdüşümüdür.

---

## Hüsn-i Hat Müzesi Niteliğindeki Duvarlar

Bursa Ulu Camii, hat sanatı uzmanları tarafından haklı olarak **"İslam Hat Sanatının Açık Hava Müzesi"** kabul edilir. Caminin duvarlarında ve payelerinde 19. yüzyılın en büyük hat üstatları (Fettah Efendi, Şefik Bey, Yesarizade Mustafa İzzet, Sami Efendi) tarafından yazılmış 87 ayrı hat levhası ve 132 yazı kompozisyonu yer alır. Kufi, sülüs, celi sülüs, nesih ve talik hatlarla işlenmiş Esma-ül Hüsna ve "Vav" harfi kompozisyonları mistik bir derinliğe sahiptir.

---

## Cumalıkızık: 700 Yıllık Yaşayan Erken Osmanlı Köyü

Uludağ'ın kuzey eteklerinde yer alan Cumalıkızık, Osmanlı'nın Bursa'yı fethinden önce kurduğu 7 Kızık köyünden günümüze özgün dokusunu koruyarak ulaşabilen tek köydür:
- **Mimari Karakter:** Moloz taş, kerpiç ve ahşap karkas ile inşa edilen 2-3 katlı konaklar; çivit mavisi, aşı boyası sarısı ve mor cepheleriyle sokakları süsler.
- **Cin Aralığı:** Dünyanın en dar sokaklarından biri kabul edilen Cin Aralığı, üst üste binen cumbalar ve taş döşeli dar yollarıyla Erken Osmanlı kırsal yaşamının yaşayan açık hava müzesidir.

---

## Bursa Kültür ve Gastronomi İpuçları
- **Bursa Tarihi Aksı:** Ulu Camii ziyaretinizi yanı başındaki **Kapalıçarşı**, **Koza Han** (İpekçiler Çarşısı), **Yeşil Cami & Yeşil Türbe** ve Tophane yamaçlarındaki **Osman Gazi ve Orhan Gazi Türbeleri** ile birleştiriniz.
- **Gastronomi:** Koza Han avlusunda közde Türk kahvesi içip tarihi çarşıda orijinal Bursa İskender Kebabı ve kestane şekerini tatmadan şehirden ayrılmayınız.`
  }
};

async function main() {
  console.log("Masterwork makaleler veritabanına ve articles.json dosyasına işleniyor...");

  const articlesJsonPath = path.resolve(process.cwd(), "data/articles.json");
  const rawArticles = fs.readFileSync(articlesJsonPath, "utf-8");
  const articlesList: MasterworkArticle[] = JSON.parse(rawArticles);

  for (const [slug, data] of Object.entries(MASTERWORK_ARTICLES)) {
    console.log(`\nGüncelleniyor: ${slug}`);

    // 1. Supabase güncelle
    const { error: sbErr } = await supabase
      .from("articles")
      .update({
        content: data.content,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);

    if (sbErr) {
      console.error(`Supabase güncelleme hatası (${slug}):`, sbErr.message);
    } else {
      console.log(`✅ Supabase güncellendi: ${slug} (${data.content?.length} karakter)`);
    }

    // 2. data/articles.json güncelle
    const target = articlesList.find((a) => a.slug === slug);
    if (target && data.content) {
      target.content = data.content;
    }
  }

  fs.writeFileSync(articlesJsonPath, JSON.stringify(articlesList, null, 2), "utf-8");
  console.log("\n✅ data/articles.json dosyası başarıyla güncellendi!");
}

main().catch(console.error);
