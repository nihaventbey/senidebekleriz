# Güvenlik düzeltmeleri — dağıtım sırası

Bu paket uygulama kodunu düzeltir. Canlı Supabase rol ve politika değişiklikleri
ayrı uygulanmalıdır; yerelde build almak bunları uygulamaz.

## 1. Güvenilir yönetici hesabını belirle

Supabase Auth üzerinden hesabın kullanıcı ID'si ve e-postasını doğrula.
`ADMIN_USER_ID` ve `ADMIN_EMAIL` değerlerini bu hesaba ayarla. Eski
`user_metadata.role` değerinden otomatik yönetici seçme: kullanıcı tarafından
değiştirilebilen bu alan güvenilir değildir.

```bash
rtk npm run auth:grant-admin
```

Script servis anahtarıyla ID/e-posta eşleşmesini doğrular; yalnız `app_metadata.role`
alanını günceller, şifre değiştirmez ve kullanıcı oluşturmaz/silmez.

## 2. Güvenlik migration'ını uygula

`supabase/migrations/017_secure_admin_authorization.sql` dosyasını Supabase SQL
Editor üzerinden tek transaction olarak uygula. Bu migration bilinen yönetim
politikalarını değiştirir; public yayın okuma politikalarını korur.

**Bu geçiş için mevcut `npm run db:migrate` komutunu kullanma:** eski çalıştırıcı
migration geçmişi tutmadan tüm dosyaları yeniden yürütür. Migration altyapısı
ayrı iyileştirme aşamasındadır.

`public.is_admin()` güvenli bir search_path ile, `auth.uid()` üzerinden güncel
`raw_app_meta_data` rolünü okur. JWT içindeki eski bir admin claim'ine dayanmaz.
Normal authenticated kullanıcılar auth.users tablosuna doğrudan erişim kazanmaz.

## 3. Yeni uygulamayı dağıt

Rol atama ve migration'dan sonra yeni build'i dağıt. Eski deploy/ dizini bu
çalışmanın parçası olarak güncellenmedi; eski paketi yeniden yayımlama.

Yönetici tekrar giriş yapsın. Normal kullanıcı ve yalnız user_metadata.role=admin
olan kullanıcı yönetim işlemlerini yapamamalı. Anonim istekler de reddedilmeli.
Cron işleri CRON_SECRET ile çalışmaya devam eder; keşif servisi cookie oturumuna
bağlı değildir.

## 4. Canlı ortam kabul kontrolleri

- Gerçek anon/authenticated/admin bağlantılarıyla SELECT/INSERT/UPDATE/DELETE
  RLS matrisi doğrulansın. Yerel mock testleri canlı politika testinin yerine geçmez.
- Mevcut editör içerikleri, Markdown tabloları, kaynak linkleri ve görseller açılsın.
  Aktif HTML, iframe, SVG ve JavaScript URL'leri içerik alanında artık kaldırılır.
- URL import, sanatçı görseli ve Google News çözümleme gerçek kaynaklarla kontrol
  edilsin. Yalnız public IP, HTTP/HTTPS ve standart portlar desteklenir.
- HTML indirme üst sınırı 2 MiB, görsel indirme üst sınırı 12 MiB'dir; sınır
  sıkıştırması açılmış veri üzerinde de uygulanır. Özel ağ hedeflerine yönlendirme
  ve DNS yeniden bağlama engellenir.

## Doğrulamalar ve kalan kapsam

Yerel güvenlik testleri tüm yönetim action'larında anonim/sahte metadata reddini,
yetkili haber silme akışını, XSS temizliğini, JSON-LD kaçışını, özel IP/redirect
engellemesini, DNS sabitlemesini ve yanıt boyut sınırlarını kapsar.

Sonraki aşamalar: giriş payload şemalarının tamamlanması; migration geçmişi ve
temiz kurulum; kuyruk/transaction/idempotency; ajanda sorguları, saat dilimi,
harita aggregate'i ve cache invalidation. Bu değişiklikler henüz bu pakette yoktur.
