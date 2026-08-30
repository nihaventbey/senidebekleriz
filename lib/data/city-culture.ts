import cityCulture81 from "@/data/city-culture-81.json";

export type CityBook = {
  title: string;
  author: string;
  year?: string;
  genre: string;
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
  genre: string;
  description: string;
};

export type CityHistoricalEvent = {
  period: string;
  title: string;
  description: string;
};

export type CityNotableFigure = {
  name: string;
  role: string;
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

const CULTURE_MAP: Record<string, CityCultureData> =
  cityCulture81 as unknown as Record<string, CityCultureData>;

export function getCityCultureData(
  citySlug: string,
  cityName?: string
): CityCultureData {
  const normalizedSlug = citySlug.toLowerCase().trim();
  const data = CULTURE_MAP[normalizedSlug];
  if (data) {
    return data;
  }

  const name = cityName || citySlug;
  return {
    citySlug: normalizedSlug,
    tagline: `${name}, Anadolu'nun binlerce yıllık köklü tarihi, eşsiz gelenekleri ve kültürel zenginliğiyle parlayan nadide bir şehridir.`,
    books: [
      {
        title: `${name} Tarihi ve Kültürel Monografisi`,
        author: "Kültür Bakanlığı & Yerel Tarihçiler",
        year: "Cumhuriyet Dönemi",
        genre: "İnceleme",
        description: `${name} ilinin antik çağlardan Selçuklu ve Osmanlı'ya uzanan geçmişini, mimari mirasını ve halk kültürünü ele alan kapsamlı araştırma.`,
      },
      {
        title: `Seyahatnâme'de ${name}`,
        author: "Evliya Çelebi",
        year: "17. Yüzyıl",
        genre: "Seyahatname",
        description: `Ünlü seyyah Evliya Çelebi'nin ${name} sokaklarını, kalelerini, çarşılarını ve yöresel lezzetlerini kaleme aldığı tarihi notlar.`,
        quote: `${name} bağları, suyu ve havasıyla cana can katan şirin bir beldedir...`,
      },
      {
        title: `${name} Efsaneleri ve Masalları`,
        author: "Halk Edebiyatı Araştırmaları",
        genre: "Destan",
        description: `${name} dağlarında, kalelerinde ve yaylalarında asırlardır dilden dile aktarılan kahramanlık ve sevda efsaneleri.`,
      },
    ],
    movies: [
      {
        title: `${name} Kültür ve Doğa Belgeseli`,
        director: "TRT Belgesel / Kültür Yolu",
        year: "Günümüz",
        genre: "Kültür / Belgesel",
        description: `${name} coğrafyasının doğal güzelliklerini, kanyonlarını, tarihi konaklarını ve yaşayan geleneksel el sanatlarını sunan görsel şölen.`,
      },
      {
        title: `Anadolu'nun Renkleri: ${name}`,
        director: "Kültür Bakanlığı Yapımı",
        genre: "Tarih / Sanat",
        description: `${name} ilinde yaşamış medeniyetlerin izlerini ve günümüze ulaşan zengin arkeolojik mirası inceleyen yapım.`,
      },
    ],
    music: [
      {
        title: `${name} Yöresi Halk Türküleri`,
        artist: "TRT Müzik Dairesi & Yöre Ozanları",
        genre: "Türkü",
        description: `${name} düğünlerinde, meclislerinde ve yaylalarında bağlama ve yöresel sazlar eşliğinde icra edilen asırlık ezgiler.`,
      },
      {
        title: `${name} Oyun Havaları ve Ezgileri`,
        artist: "Geleneksel Ustalar",
        genre: "Türkü",
        description: `Yöre insanının neşesini, coşkusunu ve hüznünü harmanlayan klasik halk türküleri.`,
      },
    ],
    history: [
      {
        period: "M.Ö. 2000 - Antik Çağ",
        title: `${name}'da İlk Yerleşimler ve Medeniyetler`,
        description: `Hitit, Frig, Roma ve Bizans medeniyetlerinin ${name} topraklarında bıraktığı kaleler, tümülüsler ve kaya anıtları.`,
      },
      {
        period: "1071 - 1400",
        title: "Selçuklu ve Beylikler Dönemi",
        description: `Malazgirt sonrası Türk fethiyle birlikte ${name}'da inşa edilen ulu camiler, medreseler, köprüler ve kervansaraylar.`,
      },
      {
        period: "Osmanlı Dönemi",
        title: "Ticaret ve Zanaatın Altın Çağı",
        description: `İpek Yolu güzergahında gelişen hanlar, bedestenler, saat kuleleri ve geleneksel Osmanlı konak mimarisi.`,
      },
      {
        period: "1919 - 1923",
        title: "Milli Mücadele ve Cumhuriyet",
        description: `Kurtuluş Savaşı'nda ${name} halkının bağımsızlık yolundaki fedakarlıkları ve Cumhuriyet ile birlikte yaşanan modern kalkınma hamleleri.`,
      },
    ],
    figures: [
      {
        name: `${name} Halk Ozanları ve Âşıkları`,
        role: "Yazar / Şair",
        era: "16-20. Yüzyıl",
        description: `${name} yöresinde sazı ve sözüyle halkın duygularına tercüman olan, sevgi ve hoşgörü kültürünü yayan ozanlar.`,
        famousWorks: ["Yöre Koşmaları", "Güzellemeler", "Taşlamalar"],
      },
      {
        name: `${name} Erenleri ve Mutasavvıfları`,
        role: "Düşünür / Bilim İnsanı",
        era: "Selçuklu & Osmanlı",
        description: `${name} ilinde zaviyeler ve medreseler kurarak ilim, ahlak ve kardeşlik bağlarını güçlendiren manevi şahsiyetler.`,
      },
      {
        name: `${name} Milli Mücadele Kahramanları`,
        role: "Tarihi Şahsiyet",
        era: "1919-1923",
        description: `Kuvâ-yi Milliye saflarında vatan müdafaasına katılan ve ${name} sancağını onurla taşıyan yerel önderler.`,
      },
    ],
  };
}
