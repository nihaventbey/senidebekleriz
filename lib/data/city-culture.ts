export type CityBook = {
  title: string;
  author: string;
  year?: string;
  genre: "Roman" | "Şiir" | "Seyahatname" | "İnceleme" | "Anı" | "Destan";
  description: string;
  quote?: string;
};

export type CityMovie = {
  title: string;
  director: string;
  year?: string;
  genre: string;
  description: string;
};

export type CityMusic = {
  title: string;
  artist: string;
  genre: "Türkü" | "Türk Sanat Müziği" | "Pop / Rock" | "Klasik / Senfoni" | "Ağıt";
  description: string;
};

export type CityHistoricalEvent = {
  period: string;
  title: string;
  description: string;
};

export type CityNotableFigure = {
  name: string;
  role:
    | "Yazar / Şair"
    | "Ressam / Sanatçı"
    | "Mimar"
    | "Besteci / Müzisyen"
    | "Düşünür / Bilim İnsanı"
    | "Tarihi Şahsiyet";
  era: string;
  description: string;
  famousWorks?: string[];
};

export type CityCultureData = {
  citySlug: string;
  tagline: string;
  books: CityBook[];
  movies: CityMovie[];
  music: CityMusic[];
  history: CityHistoricalEvent[];
  figures: CityNotableFigure[];
};

const CURATED_CITY_CULTURE: Record<string, CityCultureData> = {
  istanbul: {
    citySlug: "istanbul",
    tagline: "İki kıtanın kavuştuğu, imparatorluklar ve sanatın ebedi başkenti.",
    books: [
      {
        title: "Huzur",
        author: "Ahmet Hamdi Tanpınar",
        year: "1949",
        genre: "Roman",
        description:
          "Doğu ile Batı, eski ile yeni arasında bocalayan İstanbul aydınının iç dünyasını ve Boğaziçi'nin mistik atmosferini anlatan Türk edebiyatının başyapıtı.",
        quote: "Boğaz, musiki gibi insana derinleşen bir hatıra gibi gelir...",
      },
      {
        title: "İstanbul: Hatıralar ve Şehir",
        author: "Orhan Pamuk",
        year: "2003",
        genre: "Anı",
        description:
          "Nobel ödüllü yazarın çocukluk anıları ile kentin 'hüzün' duygusunu, mimarisini ve siyah-beyaz geçmişini harmanladığı otobiyografik şaheser.",
        quote: "İstanbul'un hüznü sadece bir ruh hali değil, şehrin bizzat kendisidir.",
      },
      {
        title: "İstanbul'u Dinliyorum",
        author: "Orhan Veli Kanık",
        year: "1947",
        genre: "Şiir",
        description:
          "Gözleri kapalı bir şairin Kapalıçarşı'dan Mahmutpaşa'ya, Boğaz esintisinden martı çığlıklarına uzanan unutulmaz İstanbul portresi.",
        quote: "İstanbul'u dinliyorum, gözlerim kapalı...",
      },
      {
        title: "Seyahatnâme (İstanbul Cildi)",
        author: "Evliya Çelebi",
        year: "17. Yüzyıl",
        genre: "Seyahatname",
        description:
          "17. yüzyıl Osmanlı İstanbul'unun loncalarını, çarşılarını, saraylarını ve günlük yaşamını benzersiz bir mizah ve detayla aktaran abidevi eser.",
      },
    ],
    movies: [
      {
        title: "Uzak",
        director: "Nuri Bilge Ceylan",
        year: "2002",
        genre: "Dram",
        description:
          "Cannes Film Festivali'nde Büyük Jüri Ödülü kazanan, karlı bir İstanbul kışında iki akrabanın yabancılaşmasını ve yalnızlığını işleyen sinema klasiği.",
      },
      {
        title: "Sevmek Zamanı",
        director: "Metin Erksan",
        year: "1965",
        genre: "Dram / Romantik",
        description:
          "Büyükada'da bir kadının suretine aşık olan boyacı Halil'in öyküsü üzerinden Türk sinemasının en şiirsel İstanbul görsel dili.",
      },
      {
        title: "Ah Güzel İstanbul",
        director: "Atıf Yılmaz",
        year: "1966",
        genre: "Dram / Komedi",
        description:
          "Geleneksel İstanbul beyefendisi Haşmet İbriktaroğlu ile Anadolu'dan gelen Ayşe'nin değişen kentin sokaklarındaki dokunaklı hikayesi.",
      },
      {
        title: "Crossing the Bridge: The Sound of Istanbul",
        director: "Fatih Akın",
        year: "2005",
        genre: "Müzik / Belgesel",
        description:
          "İstanbul'un rock, arabesk, hip-hop, klasik Türk müziği ve sokak ezgilerini bir araya getiren büyüleyici ses mozaiği.",
      },
    ],
    music: [
      {
        title: "Aziz İstanbul",
        artist: "Münir Nurettin Selçuk (Söz: Yahya Kemal Beyatlı)",
        genre: "Türk Sanat Müziği",
        description:
          "Yahya Kemal'in 'Sana dün bir tepeden baktım aziz İstanbul' mısralarının Münir Nurettin Selçuk bestesiyle abideleşen eseri.",
      },
      {
        title: "İstanbul Hatırası",
        artist: "Müzeyyen Senar",
        genre: "Türk Sanat Müziği",
        description:
          "Kentin nostaljik aşklarını ve Boğaziçi mehtaplarını terennüm eden unutulmaz klasik.",
      },
      {
        title: "İstanbul'da Sonbahar",
        artist: "Teoman",
        genre: "Pop / Rock",
        description:
          "Yağmurlu Galata sokaklarını ve Boğaz rüzgarını modern rock tınılarıyla hafızalara kazıyan çağdaş İstanbul marşı.",
      },
    ],
    history: [
      {
        period: "M.Ö. 667",
        title: "Byzantion'un Kuruluşu",
        description:
          "Megaralı kolonistler tarafından Sarayburnu sırtlarında kurulan kent, adını komutan Byzas'tan aldı.",
      },
      {
        period: "11 Mayıs 330",
        title: "Konstantinopolis: Roma'nın Yeni Başkenti",
        description:
          "İmparator I. Konstantin kenti Roma İmparatorluğu'nun yeni başkenti ilan etti ve bin yıllık Bizans devri başladı.",
      },
      {
        period: "29 Mayıs 1453",
        title: "İstanbul'un Fethi",
        description:
          "Fatih Sultan Mehmed komutasındaki Osmanlı ordusu şehri fethederek Orta Çağ'ı kapattı ve şehri bir cihan imparatorluğunun merkezine dönüştürdü.",
      },
      {
        period: "6 Ekim 1923",
        title: "İstanbul'un Kurtuluşu",
        description:
          "Kurtuluş Savaşı zaferinin ardından Türk ordusu İstanbul'a girerek 5 yıllık İtilaf işgaline son verdi.",
      },
    ],
    figures: [
      {
        name: "Mimar Sinan",
        role: "Mimar",
        era: "16. Yüzyıl",
        description:
          "Süleymaniye, Şehzade ve Mihrimah Sultan külliyeleriyle İstanbul silüetini ebediyen şekillendiren deha.",
        famousWorks: ["Süleymaniye Camii", "Rüstem Paşa Camii", "Mihrimah Sultan Camii"],
      },
      {
        name: "Yahya Kemal Beyatlı",
        role: "Yazar / Şair",
        era: "20. Yüzyıl",
        description:
          "İstanbul'un fethini, Boğaz mehtaplarını ve Üsküdar sokaklarını Türk şiirinin zirvesine taşıyan neoklasik şair.",
        famousWorks: ["Kendi Gök Kubbemiz", "Eski Şiirin Rüzgâriyle", "Aziz İstanbul"],
      },
      {
        name: "Osman Hamdi Bey",
        role: "Ressam / Sanatçı",
        era: "19-20. Yüzyıl",
        description:
          "İlk Türk arkeoloğu, İstanbul Arkeoloji Müzeleri'nin kurucusu ve Türk resim sanatının öncüsü.",
        famousWorks: ["Kaplumbağa Terbiyecisi", "Silah Taciri", "Kuran Okuyan Kız"],
      },
    ],
  },

  izmir: {
    citySlug: "izmir",
    tagline: "Ege'nin incisi, Akdeniz meltemleri ve özgür ruhlu sanatın beşiği.",
    books: [
      {
        title: "İzmir Büyücüleri",
        author: "Mara Meimaridi",
        year: "2002",
        genre: "Roman",
        description:
          "19. yüzyıl sonu ve 20. yüzyıl başı kozmopolit İzmir'inde Frenk Mahallesi, Kordon boyu ve Levanten yaşamını anlatan kült roman.",
      },
      {
        title: "Aşk-ı Memnu",
        author: "Halid Ziya Uşaklıgil",
        year: "1899",
        genre: "Roman",
        description:
          "İzmir doğumlu büyük yazar Halid Ziya'nın edebiyatımıza kazandırdığı psikolojik derinliği en yüksek başyapıt.",
      },
      {
        title: "Kordon Boyu Şiirleri",
        author: "Attilâ İlhan",
        year: "20. Yüzyıl",
        genre: "Şiir",
        description:
          "İzmirli usta şair Attilâ İlhan'ın Karşıyaka, Pasaport ve imbat rüzgarıyla yoğrulmuş unutulmaz mısraları.",
        quote: "Ne vakit bir yaşamak düşünsem, bu kurtlar sofrasında belki zor...",
      },
    ],
    movies: [
      {
        title: "Susuz Yaz",
        director: "Metin Erksan (Eser: Necati Cumalı)",
        year: "1963",
        genre: "Dram",
        description:
          "İzmir Urla'da çekilen ve Berlin Film Festivali'nde 'Altın Ayı' kazanarak Türk sinemasına ilk uluslararası büyük ödülü getiren başyapıt.",
      },
      {
        title: "Babam ve Oğlum",
        director: "Çağan Irmak",
        year: "2005",
        genre: "Dram",
        description:
          "Ege'nin çiftlik hayatı ile 1980 sonrası kuşak çatışmasını ve aile bağlarını gözler önüne seren duygusal şaheser.",
      },
    ],
    music: [
      {
        title: "İzmir Marşı",
        artist: "Anonim / Senfonik Uyarlama",
        genre: "Klasik / Senfoni",
        description:
          "Kurtuluş Savaşı'nın nihai zaferini ve İzmir'in dağlarında açan çiçekleri simgeleyen milli coşku eseri.",
      },
      {
        title: "İzmir'in Kavakları",
        artist: "Ege Türküleri / Anonim",
        genre: "Türkü",
        description:
          "Çakıcı Efe hikayesiyle bütünleşen, Ege zeybek kültürünün en dokunaklı ve bilinen ezgisi.",
      },
      {
        title: "Kalbim Ege'de Kaldı",
        artist: "Sezen Aksu",
        genre: "Pop / Rock",
        description:
          "İzmirli minik serçe Sezen Aksu'nun kentin ılık rüzgarlarını ve Akdeniz ruhunu yansıtan unutulmaz şarkısı.",
      },
    ],
    history: [
      {
        period: "M.Ö. 3000",
        title: "Bayraklı (Smyrna) Höyüğü",
        description:
          "Kentin ilk yerleşimi Bayraklı'da kuruldu ve Homeros'un yaşadığı düşünülen ilk Smyrna kültürü filizlendi.",
      },
      {
        period: "M.Ö. 334",
        title: "Büyük İskender ve Kadifekale",
        description:
          "Büyük İskender'in gördüğü rüya üzerine Pagos (Kadifekale) eteklerinde modern İzmir şehri yeniden kuruldu.",
      },
      {
        period: "9 Eylül 1922",
        title: "İzmir'in Kurtuluşu",
        description:
          "Fahrettin Altay komutasındaki süvari birliklerinin Hükümet Konağı'na Türk bayrağını çekmesiyle Kurtuluş Savaşı askeri zaferle taçlandı.",
      },
    ],
    figures: [
      {
        name: "Homeros",
        role: "Yazar / Şair",
        era: "M.Ö. 8. Yüzyıl",
        description:
          "İlyada ve Odysseia destanlarının yaratıcısı, antik çağın en büyük ozanı. Antik kaynaklarda Meles Çayı (İzmir) kıyısında doğduğu kabul edilir.",
        famousWorks: ["İlyada", "Odysseia"],
      },
      {
        name: "Attilâ İlhan",
        role: "Yazar / Şair",
        era: "1925-2005",
        description:
          "Menemen doğumlu, Türk edebiyatının 'kaptan'ı; şair, romancı ve düşünce insanı.",
        famousWorks: ["Ben Sana Mecburum", "Sırtlan Payı", "Sisler Bulvarı"],
      },
      {
        name: "Necati Cumalı",
        role: "Yazar / Şair",
        era: "1921-2001",
        description:
          "Urla ve Ege insanının yaşamını, tütün tarlalarını ve adalet arayışını edebiyatımıza armağan eden yazar.",
        famousWorks: ["Susuz Yaz", "Tütün Zamanı", "Zeliş"],
      },
    ],
  },

  ankara: {
    citySlug: "ankara",
    tagline: "Cumhuriyet'in kurulduğu, bozkırın ortasında yükselen modern Türkiye'nin kalbi.",
    books: [
      {
        title: "Ankara",
        author: "Yakup Kadri Karaosmanoğlu",
        year: "1934",
        genre: "Roman",
        description:
          "Milli Mücadele günlerinden modern Cumhuriyet başkentine dönüşüm sürecini ve başkentin ruhunu üç farklı dönemde ele alan başyapıt.",
        quote: "Bozkırın ortasında yeni bir dünya kuruluyordu...",
      },
      {
        title: "Bir Düğün Gecesi",
        author: "Adalet Ağaoğlu",
        year: "1979",
        genre: "Roman",
        description:
          "Ankara'da bir düğün salonunda geçen, dönemin Türkiye'sinin aydın, asker ve bürokrasi kesitini olağanüstü bir kurguyla işleyen roman.",
      },
      {
        title: "Bizim Şehir: Ankara Yazıları",
        author: "Ahmet Hamdi Tanpınar",
        year: "1946 (Beş Şehir)",
        genre: "İnceleme",
        description:
          "Tanpınar'ın Beş Şehir eserinde Ankara Kalesi, Frig geçmişi ve genç Cumhuriyet'in coşkusunu anlattığı unutulmaz deneme.",
      },
    ],
    movies: [
      {
        title: "Kelebekler",
        director: "Tolga Karaçelik",
        year: "2018",
        genre: "Komedi / Dram",
        description:
          "Sundance Film Festivali'nde Büyük Jüri Ödülü kazanan, Hasanpaşa köyüne doğru yola çıkan Ankaralı kardeşlerin absürt ve hüzünlü hikayesi.",
      },
      {
        title: "Behzat Ç. Seni Kalbime Gömdüm",
        director: "Serdar Akar",
        year: "2011",
        genre: "Polisiye / Suç",
        description:
          "Ankara'nın gri sokaklarını, Kızılay ayazını, Sakarya Caddesi'ni ve cinayet büro dedektiflerini sinemaya taşıyan kült yapım.",
      },
    ],
    music: [
      {
        title: "Ankara'nın Taşına Bak",
        artist: "Anonim / Ruhi Su",
        genre: "Türkü",
        description:
          "Kurtuluş Savaşı yıllarında Mustafa Kemal Paşa ve ordusunun Ankara'ya gelişiyle dillerde marşlaşan tarihi ezgi.",
      },
      {
        title: "Ankara Ayazı",
        artist: "Ezginin Günlüğü / Modern Folk Üçlüsü",
        genre: "Pop / Rock",
        description:
          "Başkentin kış gecelerini, Tunalı Hilmi ve Kuğulu Park anılarını notalara döken nostaljik melodi.",
      },
    ],
    history: [
      {
        period: "M.Ö. 1200",
        title: "Gordion ve Frigya Krallığı",
        description:
          "Polatlı yakınlarındaki Gordion, Kral Midas'ın başkenti olarak Frig uygarlığının ve ünlü Gordion Düğümü'nün beşiği oldu.",
      },
      {
        period: "23 Nisan 1920",
        title: "TBMM'nin Açılışı",
        description:
          "Ulus'taki ilk meclis binasında Türkiye Büyük Millet Meclisi toplanarak millet egemenliğini ilan etti.",
      },
      {
        period: "13 Ekim 1923",
        title: "Ankara'nın Başkent Oluşu",
        description:
          "Milli Mücadele'nin stratejik karargahı olan Ankara, kanunla Türkiye Cumhuriyeti'nin başkenti ilan edildi.",
      },
    ],
    figures: [
      {
        name: "Ahmet Hamdi Tanpınar",
        role: "Yazar / Şair",
        era: "1901-1962",
        description:
          "Ankara Erkek Lisesi'nde öğretmenlik yapan ve başkentin bozkır hüznünü 'Beş Şehir' ile ölümsüzleştiren edebiyat devi.",
        famousWorks: ["Beş Şehir", "Saatleri Ayarlama Enstitüsü", "Huzur"],
      },
      {
        name: "Adalet Ağaoğlu",
        role: "Yazar / Şair",
        era: "1929-2020",
        description:
          "Nallıhan doğumlu, Ankara bürokrasisi ve aydın dünyasını en yalın dille kaleme alan Türk edebiyatının usta romancısı.",
        famousWorks: ["Ölmeye Yatmak", "Bir Düğün Gecesi", "Fikrimin İnce Gülü"],
      },
    ],
  },

  bursa: {
    citySlug: "bursa",
    tagline: "Yeşil Bursa; Osmanlı'nın beşiği, ipeğin ve ulu çınarların şehri.",
    books: [
      {
        title: "Bursa'da Zaman",
        author: "Ahmet Hamdi Tanpınar",
        year: "1941",
        genre: "Şiir",
        description:
          "Bursa'nın camilerini, şadırvanlarını, çınarlarını ve mistik sükunetini Türk şiirinin en lirik mısralarıyla anlatan anıt şiir.",
        quote: "Bursa'da bir eski cami avlusu, küçük şadırvanda şakırdayan su...",
      },
      {
        title: "Osmancık",
        author: "Tarık Buğra",
        year: "1983",
        genre: "Roman",
        description:
          "Osman Gazi'nin rüyasından Bursa'nın fethine uzanan beylikten imparatorluğa geçiş destanı.",
      },
    ],
    movies: [
      {
        title: "Hacivat Karagöz Neden Öldürüldü?",
        director: "Ezel Akay",
        year: "2006",
        genre: "Tarih / Komedi / Dram",
        description:
          "14. yüzyıl Bursa'sında Orhan Gazi döneminde gölge oyunu ustaları Hacivat ve Karagöz'ün doğuşunu ve trajikomik öyküsünü işleyen kült yapım.",
      },
    ],
    music: [
      {
        title: "Bursa'nın Ufak Tefek Taşları",
        artist: "Bursa Yöresi / Müzeyyen Senar",
        genre: "Türkü",
        description:
          "Kentin sokaklarını, gençlik sevdasını ve Yeşil Türbe zarafetini dillendiren en meşhur Bursa türküsü.",
      },
    ],
    history: [
      {
        period: "6 Nisan 1326",
        title: "Bursa'nın Fethi",
        description:
          "Orhan Gazi komutasındaki Osmanlı kuvvetleri şehri fethederek ilk büyük başkenti ilan etti.",
      },
      {
        period: "1421",
        title: "Yeşil Külliye'nin İnşası",
        description:
          "Çelebi Mehmed döneminde tamamlanan Yeşil Camii ve Yeşil Türbe, erken Osmanlı çini ve mimari sanatının zirvesi oldu.",
      },
    ],
    figures: [
      {
        name: "Süleyman Çelebi",
        role: "Yazar / Şair",
        era: "14-15. Yüzyıl",
        description:
          "Bursa Ulu Camii imamlığı sırasında dünyaca ünlü 'Vesiletü'n-Necat' (Mevlid) eserini kaleme alan büyük şair.",
        famousWorks: ["Vesiletü'n-Necat (Mevlid)"],
      },
      {
        name: "Zeki Müren",
        role: "Besteci / Müzisyen",
        era: "1931-1996",
        description:
          "Bursa Hisar doğumlu, 'Sanat Güneşi' unvanıyla Türk Sanat Müziği'ne damga vuran efsanevi solist ve bestekar.",
      },
    ],
  },

  antalya: {
    citySlug: "antalya",
    tagline: "Likya ve Pamfilya'nın güneşi, turkuaz kıyıların ve antik tiyatroların diyarı.",
    books: [
      {
        title: "Yaban İncirleri",
        author: "Fakir Baykurt",
        year: "1970'ler",
        genre: "Roman",
        description:
          "Akdeniz köylerinin, Toros yaylalarının ve Antalya kıyılarının insan hikayelerini anlatan roman.",
      },
      {
        title: "Likya Yolu Rehberi",
        author: "Kate Clow",
        year: "1999",
        genre: "Seyahatname",
        description:
          "Antalya'dan Fethiye'ye uzanan dünyanın en iyi 10 yürüyüş rotasından biri olan Likya Yolu'nun keşif kitabı.",
      },
    ],
    movies: [
      {
        title: "Altın Portakal Seçkisi / Dondurmam Gaymak",
        director: "Yüksel Aksu",
        year: "2006",
        genre: "Komedi",
        description:
          "Türkiye'nin en köklü film festivali olan Antalya Altın Portakal Film Festivali'nde iz bırakan Akdeniz-Ege neşesi.",
      },
    ],
    music: [
      {
        title: "Antalya'nın Mor Üzümü",
        artist: "Sümer Ezgü / Teke Yöresi",
        genre: "Türkü",
        description:
          "Teke Zortlatması ritmiyle Akdeniz ve Toros Yörük kültürünün neşeli ve coşkulu ezgisi.",
      },
    ],
    history: [
      {
        period: "M.Ö. 159",
        title: "Attaleia'nın Kuruluşu",
        description:
          "Bergama Kralı II. Attalos'un 'Bana yeryüzünün cennetini bulun' emriyle kentin temelleri atıldı.",
      },
      {
        period: "M.S. 130",
        title: "Hadrian Kapısı (Üçkapılar)",
        description:
          "Roma İmparatoru Hadrianus'un kenti ziyareti şerefine inşa edilen anıtsal beyaz mermer tak.",
      },
    ],
    figures: [
      {
        name: "Aziz Nikolaos (Noel Baba)",
        role: "Tarihi Şahsiyet",
        era: "M.S. 4. Yüzyıl",
        description:
          "Patara doğumlu, Myra (Demre) piskoposu; cömertliği ve yardımlarıyla tüm dünyada Noel Baba efsanesine dönüşen tarihi figür.",
      },
    ],
  },

  konya: {
    citySlug: "konya",
    tagline: "Aşkın, tasavvufun ve Selçuklu medeniyetinin manevi başkenti.",
    books: [
      {
        title: "Mesnevi",
        author: "Mevlânâ Celâleddîn-i Rûmî",
        year: "13. Yüzyıl",
        genre: "Şiir",
        description:
          "Konya'da yazılan, insan sevgisini, evrensel hoşgörüyü ve tasavvuf felsefesini 25 bin beyitte anlatan insanlık mirası.",
        quote: "Gel, ne olursan ol yine gel...",
      },
      {
        title: "Aşk",
        author: "Elif Şafak",
        year: "2009",
        genre: "Roman",
        description:
          "Mevlana ile Şems-i Tebrizi'nin 13. yüzyıl Konya'sındaki dostluğunu ve kırk kuralı işleyen dünya çapında çok satan roman.",
      },
    ],
    movies: [
      {
        title: "Mevlana: Mest-i Aşk",
        director: "Hasan Fathi",
        year: "2024",
        genre: "Tarih / Biyografi",
        description:
          "Mevlana Celaleddin Rumi ve Şems-i Tebrizi'nin Konya'daki manevi yolculuklarını sinema perdesine taşıyan uluslararası yapım.",
      },
    ],
    music: [
      {
        title: "Niyaz İlahisi & Sema Ayini",
        artist: "Mevlevi Müziği (Itri / Dede Efendi)",
        genre: "Klasik / Senfoni",
        description:
          "Ney tınılarıyla semazenlerin dönüşüne eşlik eden, UNESCO Somut Olmayan Kültürel Miras listesindeki Mevlevi ayini.",
      },
    ],
    history: [
      {
        period: "M.Ö. 7400",
        title: "Çatalhöyük Neolitik Kenti",
        description:
          "İnsanlığın ilk yerleşik tarım ve şehir hayatına geçtiği, UNESCO Dünya Mirası neolitik yerleşim.",
      },
      {
        period: "1097 - 1308",
        title: "Anadolu Selçuklu Başkenti",
        description:
          "Konya iki asır boyunca Selçuklu Devleti'nin başkenti olarak bilim, sanat ve mimaride altın çağını yaşadı.",
      },
    ],
    figures: [
      {
        name: "Mevlânâ Celâleddîn-i Rûmî",
        role: "Düşünür / Bilim İnsanı",
        era: "1207-1273",
        description:
          "Konya'da türbesi bulunan, evrensel barış, sevgi ve tasavvuf düşüncesiyle dünyayı etkileyen mutasavvıf düşünür.",
        famousWorks: ["Mesnevi", "Divan-ı Kebir", "Fihi Ma Fih"],
      },
      {
        name: "Nasreddin Hoca",
        role: "Düşünür / Bilim İnsanı",
        era: "13. Yüzyıl",
        description:
          "Akşehir'de türbesi bulunan, zekası, hicvi ve düşündüren fıkralarıyla Türk halk kültürünün efsanesi.",
      },
    ],
  },

  trabzon: {
    citySlug: "trabzon",
    tagline: "Karadeniz'in hırçın dalgaları, kemençe sesleri ve Sümela'nın görkemi.",
    books: [
      {
        title: "Gülcemal",
        author: "Sunay Akın",
        year: "2000'ler",
        genre: "İnceleme",
        description:
          "Trabzonlu şair ve araştırmacı Sunay Akın'ın Karadeniz vapurları, tarihi konakları ve kentin masalsı geçmişini anlattığı eser.",
      },
      {
        title: "Kemençenin Büyüsü",
        author: "Hasan Çakır",
        year: "2010",
        genre: "İnceleme",
        description:
          "Karadeniz yaylalarından Maçka vadilerine kemençe ve horon kültürünün derinlikleri.",
      },
    ],
    movies: [
      {
        title: "Kalandar Soğuğu",
        director: "Mustafa Kara",
        year: "2015",
        genre: "Dram",
        description:
          "Trabzon'un dağ köyünde boğa güreşleri ve maden arama tutkusuyla doğayla mücadele eden ailenin Tokyo Film Festivali ödüllü başyapıtı.",
      },
      {
        title: "Son Mektup",
        director: "Özhan Eren",
        year: "2015",
        genre: "Tarih / Savaş",
        description:
          "Çanakkale ve Karadeniz cephelerindeki kahramanlıkları işleyen tarihi dram.",
      },
    ],
    music: [
      {
        title: "Divane Aşık Gibi",
        artist: "Kazım Koyuncu / Erkan Ocaklı",
        genre: "Türkü",
        description:
          "Trabzon Maçka yöresine ait, Karadeniz kemençesinin hüzün ve coşkuyu aynı anda yaşatan ölümsüz türküsü.",
      },
      {
        title: "Çayeli'nden Öteye",
        artist: "Volkan Konak",
        genre: "Pop / Rock",
        description:
          "Trabzonlu 'Kuzeyin Oğlu' Volkan Konak'ın Karadeniz'in deli rüzgarını sahneye taşıdığı kült yorum.",
      },
    ],
    history: [
      {
        period: "M.S. 386",
        title: "Sümela Manastırı'nın Kuruluşu",
        description:
          "Karadağ'ın sarp kayalıklarına oyulan manastır, keşişler Barnabas ve Sophronios tarafından kuruldu.",
      },
      {
        period: "26 Ekim 1461",
        title: "Trabzon'un Fethi",
        description:
          "Fatih Sultan Mehmed, Trabzon Rum İmparatorluğu'na son vererek şehri Osmanlı topraklarına kattı.",
      },
    ],
    figures: [
      {
        name: "Kanuni Sultan Süleyman",
        role: "Tarihi Şahsiyet",
        era: "1494-1566",
        description:
          "Trabzon Ortahisar Sarayı'nda doğan ve 46 yıl boyunca cihan imparatorluğunu yöneten Osmanlı padişahı.",
      },
      {
        name: "Bedri Rahmi Eyüboğlu",
        role: "Ressam / Sanatçı",
        era: "1911-1975",
        description:
          "Görele doğumlu Trabzonlu usta ressam ve şair; mozaik, hat ve Karadeniz renklerini Türk modern sanatına taşıdı.",
        famousWorks: ["Karadut", "Dol Karabakır Dol", "İstanbul Destanı"],
      },
    ],
  },

  gaziantep: {
    citySlug: "gaziantep",
    tagline: "Zeugma mozaikleri, taş konaklar ve UNESCO tescilli gastronomi başkenti.",
    books: [
      {
        title: "Antep Savunması",
        author: "Ali Nadi Ünler",
        year: "1969",
        genre: "Anı",
        description:
          "11 ay boyunca açlık ve yokluk içinde destansı bir direniş sergileyen Antep halkının bağımsızlık mücadelesi.",
      },
      {
        title: "Zeugma: Fırat'ın İncisi",
        author: "Kültür Bakanlığı Yayınları",
        year: "2000'ler",
        genre: "İnceleme",
        description:
          "Çingene Kızı mozaiği ve Roma villalarının arkeolojik keşif serüveni.",
      },
    ],
    movies: [
      {
        title: "Yol",
        director: "Şerif Gören (Senaryo: Yılmaz Güney)",
        year: "1982",
        genre: "Dram",
        description:
          "Cannes Film Festivali'nde Altın Palmiye kazanan, Güneydoğu ve Antep kırsalındaki insan dramını aktaran sinema şaheseri.",
      },
    ],
    music: [
      {
        title: "Bahçalarda Mor Meni",
        artist: "Gaziantep Yöresi / Anonim",
        genre: "Türkü",
        description:
          "Antep bağlarını, kına gecelerini ve güneydoğu ritimlerini yansıtan en meşhur yöresel türkü.",
      },
    ],
    history: [
      {
        period: "M.Ö. 300",
        title: "Zeugma Antik Kenti",
        description:
          "Büyük İskender'in generali I. Selevkos Nikator tarafından Fırat kıyısında kurulan zengin ticaret kenti.",
      },
      {
        period: "8 Şubat 1921",
        title: "'Gazi' Unvanının Verilmesi",
        description:
          "Fransız işgaline karşı sergilediği destansı savunma nedeniyle TBMM tarafından şehre 'Gazi' unvanı verildi.",
      },
    ],
    figures: [
      {
        name: "Şahin Bey (Mehmed Said)",
        role: "Tarihi Şahsiyet",
        era: "1877-1920",
        description:
          "'Düşman cesedimi çiğnemeden Antep'e giremez' sözüyle Antep savunmasının bayraklaşan kahramanı.",
      },
      {
        name: "Cahit Tanyol",
        role: "Yazar / Şair",
        era: "1914-2020",
        description:
          "Gaziantep doğumlu ünlü Türk sosyoloğu, şair ve düşünce insanı.",
      },
    ],
  },

  canakkale: {
    citySlug: "canakkale",
    tagline: "Troya efsanesinden Çanakkale Destanı'na, tarihin akışının değiştiği topraklar.",
    books: [
      {
        title: "Çanakkale Mahşeri",
        author: "Mehmet Niyazi",
        year: "1998",
        genre: "Roman",
        description:
          "1915 Çanakkale Savaşları'nı siperlerdeki Mehmetçiğin gözünden, tarihi gerçeklere sadık kalarak aktaran roman.",
      },
      {
        title: "Çanakkale Şehitlerine",
        author: "Mehmet Âkif Ersoy",
        year: "1915",
        genre: "Şiir",
        description:
          "Türk edebiyatının en lirik ve epik kahramanlık abidesi olan mısralar.",
        quote: "Ey şehid oğlu şehid, isteme benden makber, Sana âğûşunu açmış duruyor Peygamber.",
      },
    ],
    movies: [
      {
        title: "Çanakkale 1915",
        director: "Yeşim Sezgin (Eser: Turgut Özakman)",
        year: "2012",
        genre: "Tarih / Savaş",
        description:
          "Diriliş destanını ve Anzak çıkarmasına karşı Türk askerinin direnişini canlandıran etkileyici tarihi yapım.",
      },
    ],
    music: [
      {
        title: "Çanakkale İçinde Aynalı Çarşı",
        artist: "Anonim / Kastamonu-Çanakkale Ağıtı",
        genre: "Türkü",
        description:
          "Genç yaşta vatan savunmasına koşan kınalı kuzuların aziz hatırasına yakılan hüzünlü türkü.",
      },
    ],
    history: [
      {
        period: "M.Ö. 1200",
        title: "Truva Savaşı ve Tahta At Efsanesi",
        description:
          "Homeros'un İlyada destanında anlattığı, Akhalar ile Troyalılar arasındaki tarihi savaş.",
      },
      {
        period: "18 Mart 1915",
        title: "18 Mart Çanakkale Deniz Zaferi",
        description:
          "Cevat Paşa komutasındaki Türk tabyalarının Nusret Mayın Gemisi yardımıyla İtilaf donanmasını boğazda hezimete uğrattığı tarih.",
      },
    ],
    figures: [
      {
        name: "Seyit Onbaşı (Seyit Çabuk)",
        role: "Tarihi Şahsiyet",
        era: "1889-1939",
        description:
          "Mecidiye Tabyası'nda 215 kiloluk top mermisini tek başına kaldırarak Ocean zırhlısını batıran efsanevi kahraman.",
      },
      {
        name: "Piri Reis",
        role: "Düşünür / Bilim İnsanı",
        era: "1465-1554",
        description:
          "Gelibolu doğumlu, dünyaca ünlü ilk dünya haritasını ve Kitab-ı Bahriye'yi hazırlayan dahi Türk denizcisi.",
        famousWorks: ["Kitab-ı Bahriye", "1513 Dünya Haritası"],
      },
    ],
  },

  mardin: {
    citySlug: "mardin",
    tagline: "Gecesi gerdanlık, gündüzü seyranlık; dillerin ve dinlerin taşla konuştuğu masal kent.",
    books: [
      {
        title: "Mardin Şiirleri ve Masalları",
        author: "Murathan Mungan",
        genre: "Şiir",
        description:
          "Mardinli usta yazar Murathan Mungan'ın taş evleri, Mezopotamya ovasını ve çok kültürlü belleği işlediği eserleri.",
        quote: "Mardin, Mezopotamya ovasına kurulmuş bir taştan gemi gibidir...",
      },
      {
        title: "Kayıp Gül",
        author: "Serdar Özkan",
        year: "2003",
        genre: "Roman",
        description: "Mardin'in dar sokaklarında ve manastırlarında geçen felsefi yolculuk.",
      },
    ],
    movies: [
      {
        title: "Hükümet Kadın",
        director: "Sermiyan Midyat",
        year: "2013",
        genre: "Komedi / Dram",
        description: "Midyat'ın ilk kadın belediye başkanı Xate'nin renkli ve dokunaklı gerçek yaşam öyküsü.",
      },
      {
        title: "Sıla",
        director: "Gül Oğuz",
        year: "2006",
        genre: "Dram",
        description: "Mardin taş konaklarını, Dara antik kentini ve Mezopotamya güneşini tüm Türkiye'ye tanıtan dizi/film klasiği.",
      },
    ],
    music: [
      {
        title: "Mardin Kapı Şen Olur",
        artist: "Anonim / Mahmut Erdal",
        genre: "Türkü",
        description: "Mardin ve Diyarbakır kapılarını terennüm eden kadim Güneydoğu türküsü.",
      },
      {
        title: "Reyhani Dansı ve Müziği",
        artist: "Süryani & Arap & Türk Ustalar",
        genre: "Klasik / Senfoni",
        description: "Avuç içleri göğe dönük oynanan, Mardin'in mistik hoşgörüsünü simgeleyen geleneksel ezgi.",
      },
    ],
    history: [
      {
        period: "M.S. 495",
        title: "Deyrulzafaran Manastırı",
        description: "Güneş Tapınağı üzerine kurulan ve yüzyıllarca Süryani Ortodoks Patrikliği'ne ev sahipliği yapan kadim manastır.",
      },
      {
        period: "12. Yüzyıl",
        title: "Artuklu Beyliği Dönemi",
        description: "Kasımiye ve Zinciriye medreseleriyle Mardin'in altın çağını yaşadığı, taş işçiliğinin şahesere dönüştüğü dönem.",
      },
    ],
    figures: [
      {
        name: "Prof. Dr. Aziz Sancar",
        role: "Düşünür / Bilim İnsanı",
        era: "1946-Günümüz",
        description: "Savur (Mardin) doğumlu, DNA onarımı çalışmalarıyla 2015 Nobel Kimya Ödülü'nü kazanan bilim insanı.",
      },
      {
        name: "Murathan Mungan",
        role: "Yazar / Şair",
        era: "1955-Günümüz",
        description: "Mardin kültürünü, masallarını ve Mezopotamya mitolojisini Türk edebiyatına kazandıran usta yazar.",
        famousWorks: ["Mezopotamya Üçlemesi", "Kırk Oda", "Yüksek Topuklar"],
      },
    ],
  },

  edirne: {
    citySlug: "edirne",
    tagline: "Serhat şehri; Selimiye'nin gölgesinde Meriç ve Tunca'nın süzüldüğü Osmanlı başkenti.",
    books: [
      {
        title: "Edirne Şehrengizi",
        author: "Ahmet Bâdi Efendi / Şair Zâtî",
        year: "16. Yüzyıl",
        genre: "Şiir",
        description: "Edirne'nin köprülerini, camilerini, güllerini ve saray bahçelerini öven klasik divan edebiyatı başyapıtı.",
      },
      {
        title: "Kırkpınar Efsaneleri",
        author: "Ali Ayağ",
        genre: "İnceleme",
        description: "650 yılı aşkın süredir Sarayiçi'nde düzenlenen yağlı güreşlerin destansı tarihi.",
      },
    ],
    movies: [
      {
        title: "Fetih 1453",
        director: "Faruk Aksoy",
        year: "2012",
        genre: "Tarih / Savaş",
        description: "Fatih Sultan Mehmed'in Edirne Sarayı'nda devasa Şahi toplarını döktürmesini ve fetih hazırlıklarını anlatan yapım.",
      },
    ],
    music: [
      {
        title: "Kırmızı Gülün Âli Var",
        artist: "Rumeli Türküleri / Anonim",
        genre: "Türkü",
        description: "Balkan ve Edirne coğrafyasının en zarif ve hüzünlü Rumeli klasiği.",
      },
    ],
    history: [
      {
        period: "1361",
        title: "Edirne'nin Fethi ve Başkent Oluşu",
        description: "I. Murad tarafından fethedilerek 1453'e kadar Osmanlı Devleti'nin başkenti yapıldı.",
      },
      {
        period: "1575",
        title: "Selimiye Camii'nin Açılışı",
        description: "Mimar Sinan'ın 'Ustalık eserim' dediği, UNESCO Dünya Mirası mimarlık harikası Selimiye tamamlandı.",
      },
    ],
    figures: [
      {
        name: "Fatih Sultan Mehmed",
        role: "Tarihi Şahsiyet",
        era: "1432-1481",
        description: "Edirne Sarayı'nda doğan, 7 dil bilen ve 21 yaşında İstanbul'u fetheden dahi Osmanlı padişahı.",
      },
      {
        name: "Şükrü Paşa",
        role: "Tarihi Şahsiyet",
        era: "1857-1916",
        description: "Balkan Savaşları sırasında Edirne Kalesi'ni yokluk içinde 5 ay 5 gün kahramanca savunan efsane komutan.",
      },
    ],
  },

  nevsehir: {
    citySlug: "nevsehir",
    tagline: "Güzel Atlar Ülkesi Kapadokya; peri bacalarının, yeraltı şehirlerinin ve balonların diyarı.",
    books: [
      {
        title: "Kapadokya: Kayaların Sırrı",
        author: "Yorgo Seferis",
        genre: "Seyahatname",
        description: "Kapadokya vadilerindeki freskleri, kaya kiliselerini ve bin yıllık keşiş manastırlarını anlatan gezi notları.",
      },
    ],
    movies: [
      {
        title: "Kış Uykusu",
        director: "Nuri Bilge Ceylan",
        year: "2014",
        genre: "Dram",
        description: "Cannes Film Festivali'nde en büyük ödül olan Altın Palmiye'yi (Palme d'Or) kazanan, Kapadokya'nın karlı kışında bir butik otelde geçen başyapıt.",
      },
    ],
    music: [
      {
        title: "Şen Olasın Ürgüp (Cemal'im)",
        artist: "Refik Başaran / Anonim",
        genre: "Türkü",
        description: "Ürgüplü halk ozanı Refik Başaran'ın yaktığı, tüm Türkiye'nin ezbere bildiği dokunaklı ağıt.",
      },
    ],
    history: [
      {
        period: "M.S. 4. Yüzyıl",
        title: "Kapadokya Babaları ve Kaya Kiliseleri",
        description: "Aziz Basil ve Hristiyan keşişlerin Göreme vadisinde kayalara oyduğu benzersiz ibadethaneler.",
      },
      {
        period: "18. Yüzyıl",
        title: "Damat İbrahim Paşa ve Nevşehir'in Doğuşu",
        description: "Lale Devri sadrazamı Nevşehirli Damat İbrahim Paşa, doğduğu Muşkara köyünü külliye ve imaretlerle donatarak Nevşehir (Yeni Şehir) adını verdi.",
      },
    ],
    figures: [
      {
        name: "Hacı Bektâş-ı Velî",
        role: "Düşünür / Bilim İnsanı",
        era: "1209-1271",
        description: "Hacıbektaş ilçesinde türbesi bulunan, 'İncinsen de incitme' öğretisiyle hoşgörünün simgesi olan mutasavvıf.",
        famousWorks: ["Makâlât", "Fevâid"],
      },
    ],
  },

  sanliurfa: {
    citySlug: "sanliurfa",
    tagline: "Tarihin sıfır noktası Göbeklitepe, peygamberler şehri ve sıra gecelerinin yurdu.",
    books: [
      {
        title: "Göbekli Tepe: Dünyanın İlk Tapınağı",
        author: "Klaus Schmidt",
        year: "2006",
        genre: "İnceleme",
        description: "12.000 yıllık geçmişiyle insanlık tarihini ve dinler tarihini kökten değiştiren arkeolojik keşfin kitabı.",
      },
    ],
    movies: [
      {
        title: "Eşkıya",
        director: "Yavuz Turgul",
        year: "1996",
        genre: "Dram / Polisiye",
        description: "Urfalı Baran'ın (Şener Şen) Cudi dağlarından İstanbul'a uzanan efsanevi intikam ve aşk hikayesi.",
      },
    ],
    music: [
      {
        title: "Urfalıyam Ezelden",
        artist: "Kazancı Bedih / Urfa Sıra Gecesi",
        genre: "Türkü",
        description: "Urfa makam geleneğinin, gazellerin ve hoyratların en meşhur klasiği.",
      },
    ],
    history: [
      {
        period: "M.Ö. 9600",
        title: "Göbeklitepe ve Karahantepe",
        description: "UNESCO Dünya Mirası, T biçimli dikilitaşlarıyla bilinen dünyanın en eski anıtsal tapınak kompleksi.",
      },
      {
        period: "11 Nisan 1920",
        title: "Urfa'nın Kurtuluşu",
        description: "Ali Saip Bey ve 'Onikiler' öncülüğünde Fransız işgal güçlerine karşı kazanılan tarihi zafer.",
      },
    ],
    figures: [
      {
        name: "Hz. İbrahim",
        role: "Tarihi Şahsiyet",
        era: "M.Ö. 2000'ler",
        description: "Balıklıgöl efsanesiyle bilinen, tek tanrılı dinlerin atası kabul edilen peygamber.",
      },
      {
        name: "Kazancı Bedih",
        role: "Besteci / Müzisyen",
        era: "1929-2004",
        description: "Urfa gazel ve hoyrat geleneğini tamburu ve eşsiz sesiyle zirveye taşıyan usta gazelhan.",
      },
    ],
  },
};


function generateFallbackCultureData(citySlug: string, cityName: string): CityCultureData {
  return {
    citySlug,
    tagline: `${cityName}, Anadolu'nun zengin kültürü, tarihi mekanları ve köklü gelenekleriyle parlayan bir değeridir.`,
    books: [
      {
        title: `${cityName} Kültür ve Tarih Monografisi`,
        author: "Kültür Araştırmaları",
        genre: "İnceleme",
        description: `${cityName} ilinin kuruluşundan Cumhuriyet dönemine uzanan tarihi, mimari yapıları ve kültürel mirası.`,
      },
      {
        title: `Seyahatnâme'de ${cityName}`,
        author: "Evliya Çelebi",
        genre: "Seyahatname",
        description: `17. yüzyılda Evliya Çelebi'nin ${cityName} sokaklarını, hanlarını, camilerini ve geleneklerini anlattığı seyahat notları.`,
      },
    ],
    movies: [
      {
        title: `${cityName} Belgeseli: Kadim Topraklar`,
        director: "TRT Belgesel",
        genre: "Kültür / Belgesel",
        description: `${cityName} ilinin doğal güzelliklerini, tarihi camilerini, kalelerini ve geleneksel el sanatlarını gözler önüne seren görsel belgesel.`,
      },
    ],
    music: [
      {
        title: `${cityName} Yöresi Türküleri ve Ezgileri`,
        artist: "Yöre Sanatçıları & TRT Repertuvarı",
        genre: "Türkü",
        description: `${cityName} düğünlerinde, yaylalarında ve meclislerinde nesilden nesile aktarılan halk türküleri.`,
      },
    ],
    history: [
      {
        period: "Antik Dönem & Selçuklu",
        title: `${cityName}'da İlk Medeniyetler`,
        description: `Hitit, Frig, Roma ve Selçuklu dönemlerinden günümüze ulaşan kaleler, köprüler ve anıtsal yapılar.`,
      },
      {
        period: "Cumhuriyet Dönemi",
        title: `Milli Mücadele ve Kalkınma`,
        description: `${cityName} halkının bağımsızlık mücadelesine verdiği destek ve Cumhuriyet devrimleriyle modern kente dönüşümü.`,
      },
    ],
    figures: [
      {
        name: `${cityName} Âşıkları ve Düşünürleri`,
        role: "Yazar / Şair",
        era: "Geçmişten Günümüze",
        description: `${cityName} topraklarında yetişmiş saz şairleri, mutasavvıflar ve kentin kültürel hafızasını yaşatan değerler.`,
      },
    ],
  };
}

export function getCityCultureData(
  citySlug: string,
  cityName: string
): CityCultureData {
  const curated = CURATED_CITY_CULTURE[citySlug];
  if (curated) return curated;
  return generateFallbackCultureData(citySlug, cityName);
}
