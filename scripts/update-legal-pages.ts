import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const privacyPolicyHtml = `
<p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString("tr-TR")}</p>

<p><strong>Seni de Bekleriz</strong> ("Platform", "senidebekleriz.com") olarak kullanıcılarımızın kişisel verilerinin korunmasına, bilgi güvenliğine ve gizliliğine azami hassasiyet göstermekteyiz. İşbu Gizlilik Politikası, sitemizi ziyaret eden kullanıcılarımızın verilerinin 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve uluslararası veri koruma standartlarına uygun olarak nasıl işlendiğini ve korunduğunu açıklamaktadır.</p>

<h2>1. Veri Sorumlusu</h2>
<p>KVKK uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla <strong>Seni de Bekleriz</strong> ve geliştirici iş ortağı <strong>Başka bi'Dünya</strong> tarafından aşağıda belirtilen kapsamda işlenmektedir.</p>

<h2>2. Toplanan Bilgiler ve Toplama Yöntemi</h2>
<p>Platformumuzu ziyaret ettiğinizde otomatik yollarla (çerezler, sunucu günlükleri, analitik araçları) aşağıdaki veriler işlenebilir:</p>
<ul>
  <li>İnternet Protokol (IP) adresi, internet servis sağlayıcısı (ISP) bilgisi,</li>
  <li>Ziyaret tarihi ve saati, platformda geçirilen süre ve ziyaret edilen sayfalar,</li>
  <li>Tarayıcı türü, işletim sistemi ve cihaz donanım özellikleri,</li>
  <li>Kullanıcının tercihiyle yerel depolamada (LocalStorage) saklanan "Kültür Pasaportu" ve gezi listesi favorileri (bu veriler tarayıcınızda yerel olarak tutulur, sunucularımıza kimlik bilgisi olarak kaydedilmez).</li>
</ul>

<h2>3. Google AdSense ve Reklam Çerezleri (Cookies)</h2>
<p>Platformumuzda yayıncı gelir modeli kapsamında <strong>Google AdSense</strong> reklam servisi kullanılmaktadır. Google dahil olmak üzere üçüncü taraf satıcılar, sitemize veya diğer internet sitelerine daha önce yapılan ziyaretlere dayalı olarak reklam yayınlamak için çerezlerden yararlanır.</p>
<ul>
  <li>Google, reklam yayınlama sürecinde <strong>DoubleClick DART</strong> çerezi kullanabilir. Bu çerez, Google ve iş ortaklarının kullanıcılarımıza sitemize ve/veya internetteki diğer sitelere yaptıkları ziyaretlere dayalı reklamlar sunmasını sağlar.</li>
  <li>Kullanıcılar, kişiselleştirilmiş reklamcılığı devre dışı bırakmak için <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Reklam Ayarları</a> sayfasını ziyaret edebilir.</li>
  <li>Dileyen kullanıcılar, üçüncü taraf satıcıların kişiselleştirilmiş reklamcılık amacıyla çerez kullanmasını engellemek için <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a> adresini ziyaret edebilir.</li>
  <li>Google'ın reklam verilerini nasıl kullandığı hakkında ayrıntılı bilgiye <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google Reklam Gizlilik ve Şartlar</a> sayfasından ulaşabilirsiniz.</li>
</ul>

<h2>4. Çerez Politikası ve Yönetimi</h2>
<p>Çerezler, web sitemizin düzgün çalışmasını sağlamak, kullanıcı deneyimini iyileştirmek, trafik analizleri yapmak ve hedeflenmiş reklam gösterimleri sunmak için tarayıcınıza kaydedilen küçük metin dosyalarıdır. Tarayıcınızın ayarlarından dilediğiniz an çerezleri silebilir veya engelleyebilirsiniz; ancak bu durumda sitemizin bazı fonksiyonları beklenen şekilde çalışmayabilir.</p>

<h2>5. 6698 Sayılı KVKK Uyarınca Haklarınız</h2>
<p>KVKK'nın 11. maddesi uyarınca veri sahipleri;</p>
<ul>
  <li>Kişisel verilerinin işlenip işlenmediğini öğrenme,</li>
  <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
  <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
  <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,</li>
  <li>Verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme haklarına sahiptir.</li>
</ul>

<h2>6. İletişim</h2>
<p>Gizlilik Politikası veya kişisel verilerinizle ilgili her türlü soru ve talepleriniz için <a href="mailto:iletisim@senidebekleriz.com">iletisim@senidebekleriz.com</a> adresi üzerinden bizimle iletişime geçebilirsiniz.</p>
`.trim();

const termsOfServiceHtml = `
<p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString("tr-TR")}</p>

<p><strong>Seni de Bekleriz</strong> web sitesine ("senidebekleriz.com") hoş geldiniz. Sitemizi ziyaret ederek, içeriklere erişerek veya sunulan araçları kullanarak aşağıda yer alan Kullanım Koşullarını peşinen kabul etmiş sayılırsınız.</p>

<h2>1. Hizmetin Kapsamı ve Amacı</h2>
<p>Seni de Bekleriz, Türkiye'nin 81 ilindeki müzeleri, antik kentleri, ören yerlerini, tarihi anıtları ve sanat mekanlarını tanıtmayı amaçlayan bağımsız bir kültür ve seyahat platformudur. Sitemizde restoran, kafe veya ticari yemek işletmesi rehberliği yapılmamakta; odak yalnızca kültürel mirasa yöneliktir.</p>

<h2>2. Fikri Mülkiyet ve İçerik Kullanımı</h2>
<p>Platformda yer alan özgün metinler, derlemeler, tasarım ögeleri ve yazılım altyapısı Seni de Bekleriz'e ve geliştirici iş ortağı Başka bi'Dünya'ya aittir. Telif hakları kanunları ile korunmaktadır.</p>
<ul>
  <li>Mekan görselleri Wikimedia Commons (Creative Commons lisansları) veya kamuya açık kaynaklardan kaynak belirtilerek kullanılmaktadır.</li>
  <li>Kullanıcılar, sitedeki içerikleri ticari olmayan kişisel gezi planları için kullanabilir.</li>
  <li>Sitemizde sunulan "Sitene Göm" (Embed) özelliği ile sağlanan iframe kodları, basın kuruluşları ve kişisel seyahat blogları tarafından kaynak değiştirilmeksizin serbestçe kullanılabilir.</li>
</ul>

<h2>3. Bilgi Doğruluğu ve Sorumluluk Reddi</h2>
<p>Sitemizde yer alan mekanlar, müzeler ve ören yerlerine ilişkin giriş ücretleri, MüzeKart geçerlilik durumları, açılış-kapanış saatleri ve ziyaret kuralları; açık veri kaynakları ve kamuya açık bildirimlerden derlenmektedir. Ziyaret saatleri ve tadilat durumları dönemsel olarak değişebileceğinden, ziyaretiniz öncesinde T.C. Kültür ve Turizm Bakanlığı veya ilgili resmi müze müdürlüklerinin teyit edilmesi önerilir. Meydana gelebilecek doğrudan veya dolaylı maddi/manevi zararlardan platform sorumlu tutulamaz.</p>

<h2>4. Üçüncü Taraf Bağlantıları ve Reklamlar</h2>
<p>Sitemiz üzerinden haritalar (Google Haritalar), ansiklopedik kaynaklar (Wikipedia/Wikidata) ve resmi kurum web sitelerine bağlantılar (linkler) verilebilir. Üçüncü taraf sitelerin içerik veya gizlilik uygulamalarından platformumuz sorumlu değildir. Platformda yer alan reklamlar Google AdSense aracılığıyla sunulmakta olup, reklam verenin taahhütleri kendisini bağlar.</p>

<h2>5. Değişiklikler ve Yürürlük</h2>
<p>Seni de Bekleriz, işbu Kullanım Koşullarını dilediği zaman güncelleme hakkını saklı tutar. Değişiklikler sitede yayımlandığı andan itibaren yürürlüğe girer.</p>

<h2>6. İletişim</h2>
<p>Kullanım koşullarına dair tüm geri bildirim ve hukuki bildirimler için <a href="mailto:iletisim@senidebekleriz.com">iletisim@senidebekleriz.com</a> adresiyle iletişim kurabilirsiniz.</p>
`.trim();

async function main() {
  console.log("Updating legal pages in Supabase...");

  const { error: privError } = await supabase
    .from("pages")
    .update({
      content: privacyPolicyHtml,
      meta_title: "Gizlilik Politikası ve Çerezler - Seni de Bekleriz",
      meta_description: "Seni de Bekleriz gizlilik ilkeleri, çerez politikası, Google AdSense ve KVKK bilgilendirme metni.",
      updated_at: new Date().toISOString(),
    })
    .eq("slug", "gizlilik-politikasi");

  if (privError) {
    console.error("Failed to update privacy policy:", privError);
  } else {
    console.log("Gizlilik politikası başarıyla güncellendi.");
  }

  const { error: termsError } = await supabase
    .from("pages")
    .update({
      content: termsOfServiceHtml,
      meta_title: "Kullanım Koşulları - Seni de Bekleriz",
      meta_description: "Seni de Bekleriz kültür ve seyahat platformu kullanım koşulları, sorumluluk reddi ve telif hakları.",
      updated_at: new Date().toISOString(),
    })
    .eq("slug", "kullanim-kosullari");

  if (termsError) {
    console.error("Failed to update terms of service:", termsError);
  } else {
    console.log("Kullanım koşulları başarıyla güncellendi.");
  }
}

main().catch(console.error);
