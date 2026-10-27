import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const iconicHeritageSites = [
  {
    name: "Efes Antik Kenti",
    slug: "efes-antik-kenti",
    citySlug: "izmir",
    categorySlug: "tarihi-yer",
    lat: 37.9408,
    lng: 27.3414,
    wikidata_id: "Q47611",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Library_of_Celsus_in_Ephesus.jpg/1200px-Library_of_Celsus_in_Ephesus.jpg",
    description: "UNESCO Dünya Mirası Listesi'nde yer alan Efes Antik Kenti; Celsus Kütüphanesi, 25.000 kişilik Antik Tiyatrosu, Meryem Ana Evi ve Yamaç Evleri ile antik dünyanın en görkemli metropollerinden biridir. İyonya döneminden Roma İmparatorluğu'na uzanan binlerce yıllık kadim bir tarihe tanıklık eder."
  },
  {
    name: "Sümela Manastırı",
    slug: "sumela-manastiri",
    citySlug: "trabzon",
    categorySlug: "tarihi-yer",
    lat: 40.6903,
    lng: 39.6583,
    wikidata_id: "Q645517",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sumela_Monastery_Trabzon_Turkey.jpg/1200px-Sumela_Monastery_Trabzon_Turkey.jpg",
    description: "Trabzon'un Maçka ilçesindeki Altındere Vadisi'ne bakan Karadağ'ın sarp kayalıklarına MS 4. yüzyılda inşa edilen Meryem Ana Manastırı (Sümela), nefes kesici konumu, fresklerle kaplı kaya kilisesi ve zengin tarihiyle Doğu Karadeniz'in en önemli kültürel simgesidir."
  },
  {
    name: "Nemrut Dağı Ören Yeri",
    slug: "nemrut-dagi-oren-yeri",
    citySlug: "adiyaman",
    categorySlug: "tarihi-yer",
    lat: 37.9806,
    lng: 38.7408,
    wikidata_id: "Q179782",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Mount_Nemrut_Ad%C4%B1yaman_Turkey.jpg/1200px-Mount_Nemrut_Ad%C4%B1yaman_Turkey.jpg",
    description: "Kommagene Kralı I. Antiochos tarafından tanrılara ve atalarına minnettarlığını sunmak üzere 2.150 metre yükseklikte inşa edilen anıtsal heykeller ve tümülüs. Doğu ve Batı teraslarındaki dev tanrı ve kral başları, gün doğumu ve gün batımında eşsiz bir tarihi panorama sunar."
  },
  {
    name: "Aspendos Antik Tiyatrosu",
    slug: "aspendos-antik-tiyatrosu",
    citySlug: "antalya",
    categorySlug: "tarihi-yer",
    lat: 36.9389,
    lng: 31.1725,
    wikidata_id: "Q214152",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Aspendos_Theater_Antalya.jpg/1200px-Aspendos_Theater_Antalya.jpg",
    description: "Romalı mimar Zenon tarafından MS 2. yüzyılda inşa edilen Aspendos Tiyatrosu, günümüze kadar en mükemmel şekilde korunmuş ve mükemmel akustiğiyle bugün dahi uluslararası opera ve bale festivallerine ev sahipliği yapan antik dünyanın en seçkin tiyatrosudur."
  },
  {
    name: "Hierapolis & Pamukkale Ören Yeri",
    slug: "hierapolis-pamukkale-oren-yeri",
    citySlug: "denizli",
    categorySlug: "tarihi-yer",
    lat: 37.9256,
    lng: 29.1219,
    wikidata_id: "Q193224",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Pamukkale_01.jpg/1200px-Pamukkale_01.jpg",
    description: "Kalsiyum oksit içeren termal suların oluşturduğu bembeyaz traverten terasları ve hemen üzerinde yükselen antik Frigya ve Roma kenti Hierapolis. Antik havuz (Kleopatra Havuzu), devasa nekropol ve antik tiyatrosu ile doğa ve tarihin buluştuğu eşsiz bir dünya mirasıdır."
  },
  {
    name: "Troya Antik Kenti",
    slug: "troya-antik-kenti",
    citySlug: "canakkale",
    categorySlug: "tarihi-yer",
    lat: 39.9575,
    lng: 26.2389,
    wikidata_id: "Q22647",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Troia_Wooden_Horse.jpg/1200px-Troia_Wooden_Horse.jpg",
    description: "Homeros'un İlyada Destanı'na konu olan efsanevi Troya Savaşı'nın gerçekleştiği, 9 ayrı arkeolojik katmandan ve 4000 yılı aşkın kesintisiz yerleşim tarihinden oluşan dünya çapında ünlü antik kent ve Troya Müzesi."
  },
  {
    name: "Çatalhöyük Neolitik Kenti",
    slug: "catalhoyuk-neolitik-kenti",
    citySlug: "konya",
    categorySlug: "tarihi-yer",
    lat: 37.6675,
    lng: 32.8283,
    wikidata_id: "Q179854",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Catal_H%C3%BCy%C3%BCk_South_Shelter.jpg/1200px-Catal_H%C3%BCy%C3%BCk_South_Shelter.jpg",
    description: "MÖ 7400 yıllarına tarihlenen ve insanlığın yerleşik hayata geçişinin, tarımın ve kentleşmenin ilk kanıtlarını barındıran en eski Neolitik yerleşim yeri. Çatıdan girilen bitişik kerpiç evleri ve duvar resimleriyle uygarlık tarihinin sıfır noktalarındandır."
  },
  {
    name: "Ani Harabeleri (Ani Arkeolojik Alanı)",
    slug: "ani-harabeleri",
    citySlug: "kars",
    categorySlug: "tarihi-yer",
    lat: 40.5075,
    lng: 43.5728,
    wikidata_id: "Q188316",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Ani_Cathedral_Kars_Turkey.jpg/1200px-Ani_Cathedral_Kars_Turkey.jpg",
    description: "Orta Çağ'da 1001 Kiliseli Şehir olarak anılan ve İpek Yolu üzerinde yükselen Ani; Ermeni Bagratuni Hanedanlığı ve Selçuklu döneminden miras katedrali, surları, camileri ve saraylarıyla Türkiye-Ermenistan sınırında Arpaçay kanyonu üzerinde yükselir."
  },
  {
    name: "İshak Paşa Sarayı",
    slug: "ishak-pasa-sarayi",
    citySlug: "agri",
    categorySlug: "tarihi-yer",
    lat: 39.5217,
    lng: 44.1294,
    wikidata_id: "Q1503348",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Ishak_Pasha_Palace_Dogubeyazit.jpg/1200px-Ishak_Pasha_Palace_Dogubeyazit.jpg",
    description: "Doğubayazıt'ta sarp bir tepe üzerine 18. yüzyılda inşa edilen, Osmanlı, Selçuklu ve Fars mimari etkilerini bir arada taşıyan külliye saray. Dünyanın ilk merkezi kalorifer/ısıtma sistemine sahip sarayı olarak tarihe geçmiştir."
  },
  {
    name: "Mevlâna Müzesi ve Türbesi",
    slug: "mevlana-muzesi-ve-turbesi",
    citySlug: "konya",
    categorySlug: "muzeler",
    lat: 37.8706,
    lng: 32.5050,
    wikidata_id: "Q766624",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Mevlana_Museum_Konya.jpg/1200px-Mevlana_Museum_Konya.jpg",
    description: "Büyük mutasavvıf, şair ve düşünür Mevlâna Celâleddîn-i Rûmî'nin dergâhı ve türbesi olan Kubbe-i Hadrâ (Yeşil Kubbe). Tasavvuf felsefesi, derviş hücreleri, semahane ve el yazması nadide eserleriyle tüm dünyadan milyonlarca ziyaretçiyi çeker."
  },
  {
    name: "Edirne Selimiye Camii ve Külliyesi",
    slug: "edirne-selimiye-camii-ve-kulliyesi",
    citySlug: "edirne",
    categorySlug: "tarihi-yer",
    lat: 41.6781,
    lng: 26.5594,
    wikidata_id: "Q184534",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Selimiye_Mosque_Edirne_Turkey.jpg/1200px-Selimiye_Mosque_Edirne_Turkey.jpg",
    description: "Büyük usta Mimar Sinan'ın 80 yaşında tamamladığı ve Ustalık eserim dediği Osmanlı mimarisinin zirve noktası. Dört minaresi, dev kubbesi, İznik çinileri ve kusursuz taş işçiliği ile UNESCO Dünya Mirası Listesi'nde yer alır."
  },
  {
    name: "Bodrum Kalesi ve Sualtı Arkeoloji Müzesi",
    slug: "bodrum-kalesi-ve-sualti-arkeoloji-muzesi",
    citySlug: "mugla",
    categorySlug: "muzeler",
    lat: 37.0319,
    lng: 27.4294,
    wikidata_id: "Q190875",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bodrum_Castle_Mugla_Turkey.jpg/1200px-Bodrum_Castle_Mugla_Turkey.jpg",
    description: "15. yüzyılda Saint Jean Şövalyeleri tarafından inşa edilen tarihi kale ve içinde yer alan dünyanın en önemli sualtı arkeoloji müzelerinden biri. Uluburun Batığı ve antik batıklardan çıkarılan paha biçilmez hazinelere ev sahipliği yapar."
  },
  {
    name: "Anadolu Medeniyetleri Müzesi",
    slug: "anadolu-medeniyetleri-muzesi",
    citySlug: "ankara",
    categorySlug: "muzeler",
    lat: 39.9383,
    lng: 32.8619,
    wikidata_id: "Q484435",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Anatolian_Civilizations_Museum_Ankara.jpg/1200px-Anatolian_Civilizations_Museum_Ankara.jpg",
    description: "Ankara Kalesi civarındaki tarihi Mahmut Paşa Bedesteni'nde yer alan, Paleolitik çağdan Neolitik, Hitit, Frig ve Urartu krallıklarına kadar Anadolu'nun benzersiz arkeolojik mirasını sergileyen ve 1997'de Avrupa'da Yılın Müzesi seçilen başyapıt."
  },
  {
    name: "Hattuşa (Hitit Başkenti Ören Yeri)",
    slug: "hattusa-hitit-baskenti",
    citySlug: "corum",
    categorySlug: "tarihi-yer",
    lat: 40.0200,
    lng: 34.6156,
    wikidata_id: "Q181261",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Hattusa_Lion_Gate.jpg/1200px-Hattusa_Lion_Gate.jpg",
    description: "Tunç Çağı'nda Anadolu'da büyük bir imparatorluk kuran Hititlerin başkenti Hattuşa; Aslanlı Kapı, Yerkapı sfenksleri, Büyük Tapınak ve Yazılıkaya Açık Hava Mabedi ile UNESCO Dünya Mirası Listesi'nde yer alan görkemli bir merkezdir."
  },
  {
    name: "Bergama Akropolü (Pergamon)",
    slug: "bergama-akropolu-pergamon",
    citySlug: "izmir",
    categorySlug: "tarihi-yer",
    lat: 39.1325,
    lng: 27.1842,
    wikidata_id: "Q18986",
    cover_image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Pergamon_Acropolis_Theatre.jpg/1200px-Pergamon_Acropolis_Theatre.jpg",
    description: "Antik dünyanın en dik yamaca kurulmuş antik tiyatrosu, Trajan Tapınağı, parşömenin anavatanı olan ünlü kütüphanesi ve şifa merkezi Asklepion ile Helenistik ve Roma döneminin başkenti olan UNESCO tescilli antik kent."
  }
];

async function seedIconicSites() {
  const { data: cities } = await supabase.from("cities").select("id, slug");
  const cityMap = Object.fromEntries(cities?.map(c => [c.slug, c.id]) || []);

  const { data: cats } = await supabase.from("categories").select("id, slug");
  const catMap = Object.fromEntries(cats?.map(c => [c.slug, c.id]) || []);

  console.log("Seeding top iconic cultural sites...");
  let count = 0;

  for (const site of iconicHeritageSites) {
    const cityId = cityMap[site.citySlug];
    const catId = catMap[site.categorySlug];

    if (!cityId) {
      console.log(`City not found for: ${site.citySlug}`);
      continue;
    }

    const { data: existing } = await supabase
      .from("places")
      .select("id")
      .eq("slug", site.slug)
      .maybeSingle();

    let placeId = existing?.id;

    if (!placeId) {
      const { data: inserted, error: insErr } = await supabase
        .from("places")
        .insert({
          name: site.name,
          slug: site.slug,
          city_id: cityId,
          lat: site.lat,
          lng: site.lng,
          wikidata_id: site.wikidata_id,
          description: site.description,
          cover_image: site.cover_image,
          cover_image_source: "manual",
          cover_image_locked: true,
          source: "manual",
          is_active: true,
          is_featured: true,
          meta_title: `${site.name} — Gezi ve Ziyaret Rehberi`,
          meta_description: site.description.slice(0, 155)
        })
        .select("id")
        .single();

      if (insErr) {
        console.error(`Insert error for ${site.name}:`, insErr.message);
        continue;
      }
      placeId = inserted?.id;
      console.log(`Inserted: ${site.name}`);
    } else {
      await supabase
        .from("places")
        .update({
          name: site.name,
          city_id: cityId,
          lat: site.lat,
          lng: site.lng,
          wikidata_id: site.wikidata_id,
          description: site.description,
          cover_image: site.cover_image,
          cover_image_source: "manual",
          cover_image_locked: true,
          source: "manual",
          is_active: true,
          is_featured: true,
          meta_title: `${site.name} — Gezi ve Ziyaret Rehberi`,
          meta_description: site.description.slice(0, 155)
        })
        .eq("id", placeId);
      console.log(`Updated existing: ${site.name}`);
    }

    if (placeId && catId) {
      const { data: existingCat } = await supabase
        .from("place_categories")
        .select("place_id")
        .eq("place_id", placeId)
        .eq("category_id", catId)
        .maybeSingle();

      if (!existingCat) {
        await supabase.from("place_categories").insert({
          place_id: placeId,
          category_id: catId
        });
      }
    }

    count++;
  }

  console.log(`Successfully processed ${count} iconic cultural sites.`);
}

seedIconicSites().catch(console.error);
