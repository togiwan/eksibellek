# EkşiBellek — proje bağlamı ve devam noktası

Son kayıt: **2 Kasım 2026**. Bu belge, yeni bir sohbetin projeyi baştan anlattırmadan sürdürebilmesi için tutulur. Vizyon ve kesinleşmiş kararları korur; değişebilen yayın durumları için son doğrulanan durumu belirtir.

## 1. Vizyon ve temel kararlar

Ekşi Sözlük okurken bir yazar hakkında kişisel not bırakmak ve başka bir başlıkta o yazarla tekrar karşılaşıldığında önceki gözlemi kolayca hatırlamak. Yazar adının başındaki küçük düğme, ilgili notları açar. Araç çubuğu penceresi not ekleme ve kayıtları yönetme işini görür.

Kullanıcının en önemli önceliği, Chrome kapanıp açıldığında kayıtların kaybolmamasıdır. Bir sunucuya veya kullanıcı hesabına ihtiyaç olmadan yerel kayıt ve kullanıcı denetimindeki JSON yedekleme tercih edilmiştir. Eklentiyi kaldırmanın/profili silmenin kayıtları silebileceği açıkça kabul edilmiş ve belgelenmiştir; “her koşulda asla silinmez” garantisi verilmez.

Kesinleşmiş kararlar:

- Son isim **EkşiBellek**. Önceki “Ekşi Defter” adı kullanılmıyor; veri/protokol kimliklerindeki eski ad geriye uyumluluk için duruyor.
- Eklenti tamamen ücretsiz kalır. Bağış herhangi bir özelliği açmanın koşulu değildir.
- Güven için kaynak kodu herkese açık GitHub deposunda, **MIT lisansı** altında yayımlandı. MIT kullanıcı tarafından açıkça seçildi.
- Önce kullanıcı tek başına test etti; olumlu test deneyiminden sonra GitHub ve Chrome Web Store yayınına geçilmesi onaylandı.
- Ürün Türkçe, sade, dengeli ve görsel olarak özenli olmalı. Dar/kayan menüler ve ortalanmayan düğmeler kabul edilmiyor.
- Reklam, analitik, notları alan sunucu, otomatik bulut senkronizasyonu veya kullanıcı hesabı mevcut kapsamda yok.
- Kullanıcının gerçek adı, kişisel e-postası ve bilgisayar bilgileri herkese açık projeye eklenmemeli. Yayımlama kimlikleri aşağıda ayrıca belirtilmiştir.

## 2. Şu anda çalışan özellikler

| Alan | Gerçekleştirilen davranış |
| --- | --- |
| Sayfa düğmesi | Kullanıcı adının başında, aynı satırda küçük not düğmesi; kayıt varsa renk ve aktif not sayısı |
| Yazar eşleştirme | Varsa sayısal yazar kimliği, aksi durumda Türkçe/Unicode normalleştirilmiş rumuz; farklı sayısal hesaplar karıştırılmaz |
| Not kutusu | Gerçek site içinde eklenti kökenindeki ayrı çerçevede yazara ait notları gösterme/ekleme |
| Araç çubuğu | Not ekle, Yazarlar, Yedekleme, Ayarlar; geniş defteri ayrı sekmede açma |
| Düzenleme | Çoklu tarihli not, kaynak entry bağlantısı/başlığı, önceki sürümlerin metin ve kaynak geçmişi |
| Düzenleme araçları | Yazar etiketleri ve renkleri; rumuz/not/etiket araması, etiket ve durum filtresi, sıralama |
| Arşiv | Aktif listeden kaldırma ve arşivden geri getirme |
| Çöp kutusu | Tek not veya yazarın tüm notlarını (arşiv dahil) geri alınabilir silme; tekli/toplu geri getirme |
| Kalıcı silme | Yalnızca çöp kutusundan, ayrıca onayla tekli silme veya çöp kutusunu boşaltma |
| Yedekleme | JSON dışa/içe aktarma; önizleme, eşdeğer notları çoğaltmama, çakışmalarda mevcut metnin üzerine sessizce yazmama |
| Görünüm | Açık, koyu ve sistem teması; yeni not taslağının yerelde korunması |
| Gönüllü destek | Ayarlar > Destek seçenekleri; TRX/TRON ve USDT/TRON-TRC20 adresi, kopyalama düğmeleri |

Çöp kutusu otomatik boşalmaz; metin ve geçmiş saklanır. Arşivden silinip geri getirilen not arşive döner. Silinen not aktif sayaçlardan ve aktif/arşiv görünümlerinden çıkar. Eski sürümle yapılan tekli veya toplu değişiklikler reddedilir.

Etiket alanında kullanıcının seçtiği örnek metin **“troll, fake”**tir. Yazarların yanındaki düğmeyi tekrar ismin sonuna taşıma.

## 3. Önemli arayüz kararlarının gerekçesi

İkon penceresinin ilk açılışta aşırı daralması birkaç kez düzeltildi. Son çözüm, ayrı `popup.html` girişinde ve CSS'te statik `popup-document` sınıfıyla **420 × 600** başlangıç boyutu tanımlamaktır. Bu, gerçek `chrome.action.openPopup` penceresinde doğrulandı; yalnızca 420 piksel bir tarayıcı sekmesine bakmak aynı kanıt değildir.

Üst menü dört sekme olarak kalır. Çöp kutusu Yazarlar içinden; destek ekranı Ayarlar içinden açılır. Dar pencerede yazar listesi ve yazar ayrıntısı ayrı görünümlerdir; geri dönüş düğmeleri vardır. İçerik ana alanda kaydırılır. Boş durumdaki “İlk notunu ekle” düğmesinin ortasını kaydıran görünmez ikon sorunu düzeltildi.

Tanıtım görseli isteğinde kullanıcı **proje sitesinin görüntüsünü değil, eklentinin gerçek Ekşi Sözlük sayfasındaki halini** kastettiğini özellikle açıkladı. Bu tercih tekrar yanlış anlaşılmamalı.

## 4. Mimari ve veri sözleşmeleri

- Manifest V3; düz JavaScript, HTML ve CSS. Çalışma zamanı bağımlılığı ve derleme adımı yok.
- İstenen API izni yalnızca `storage`. İçerik betiği sadece `https://eksisozluk.com/*` ve `https://www.eksisozluk.com/*` üzerinde çalışır.
- `extension/background.js`: güvenilir eklenti ekranı kontrolü, seri kayıt kuyruğu, depolama okuma/yazma ve bildirimler. Kalıcı yazım bitmeden başarı verilmez.
- `extension/lib/model.js`: saf veri işlemleri; kimlik, sürüm, yedek, içe aktarma, arşiv ve çöp kutusu mantığı.
- `extension/content.js`: dinamik entry'leri izler; not düğmesini yazar adının başına yerleştirir. Not metinlerini sitenin DOM'una kopyalamaz; eklenti çerçevesi kullanır.
- `extension/pages/app.js`, `app.css`, `popup.html`, `app.html`: ikon penceresi, geniş defter ve sayfa üzerindeki yazar ekranı.
- `scripts/package.py`: sabit ZIP meta verileriyle yalnızca eklenti varlıklarını ve lisansı paketler.
- `scripts/build-docs.py`: kökteki `PRIVACY.md` metninden ve proje içeriğinden GitHub Pages belgelerini üretir.
- `scripts/generate-store-assets.mjs`: temsili verilerle genel defter/çöp kutusu görsellerini üretir; gerçek site görüntüsü yerine varsayılmamalıdır.

Değiştirilmemesi gereken mevcut kimlikler:

| Sözleşme | Değer |
| --- | --- |
| Kalıcı kayıt anahtarı | `eksi-defter-v1` |
| Taslak anahtarı | `eksi-defter-draft` |
| Mesaj kanalı | `eksi-defter` |
| Güncelleme portu | `defter-updates` |
| İç depolama şeması | `1` |
| JSON biçim kimliği | `eksi-defter` |
| Güncel JSON yedek şeması | `2`; eski v1 okunur |

Yedek v2 çöp kutusu durumunu korur ve 0.1.7 veya üzeri sürüm gerektirir. Eski uygulamaların silinen notları sessizce canlandırmasını önlemek için yeni yedek biçimi ayrıdır. Önceden alınmış aktif bir yedek çöp kutusundaki sürümle çakışırsa “iki kopyayı koru” seçeneği aktif bir kopya ekleyebilir; önizleme durumları gösterir.

Mevcut bozuk depolama değeri **yeni kurulum kabul edilmez**. Boş kayıt yalnızca anahtar gerçekten yoksa oluşturulur. Gerçek kullanıcı kaydında test/temizlik yapma.

## 5. Doğrulanmış testler ve sınırları

2 Kasım 2026'daki yayın hazırlığında:

- 28 otomatik model/arka plan testi ve manifest, ikon, JavaScript sözdizimi, CSP uyumlu HTML kontrolleri geçti.
- Ayrı geçici Chrome profillerinde tekli/toplu silme, iptal, geri getirme, arşive dönüş, onaylı kalıcı silme, JSON indirme/önizleme ve eski sürümden güncelleme akışları denendi.
- Gerçek ikon penceresinde 420 × 600 boyutu, dört hizalı sekme ve destek ekranı kontrol edildi.
- Kopyalama düğmeleri verilen adresi birebir kopyaladı; ek eklenti izni gerekmedi. Gerçek para transferi denenmedi.
- Kalıcılık deneyi: 150 yazar/600 not (50 çöp kutusunda), 5 tam normal kapanma/açılma, 3 arka plan işçisi sonlandırma/uyanma, 60 eş zamanlı yazma, başarılı kayıt yanıtından hemen sonra 10 ani tarayıcı sonlandırma, 5 yanıt bekleyen işlem sırasında kapanma, gerçek kota aşımı ve yeni profilde JSON kurtarma. Önceden kaydedilen veriler korundu.
- Fiziksel elektrik kesintisi, disk arızası, her işletim sistemi veya her gelecek Chrome sürümü bu deneylerle garanti edilmiş değildir.
- İkon penceresi, masaüstü ve mobil genişlikte proje/gizlilik sayfaları incelendi.

Temel komutlar: `npm test`, `npm run check`, `npm run package`.

`npm run check:persistence` isteğe bağlı ek testtir; Playwright/Chromium yolları ortam değişkenleriyle verilir. Kişisel Chrome profili kullanılmaz. Kanıt çıktıları projeye veya ZIP'e eklenmez. `docs/ci-checks.example.yml` bir CI örneğidir; bu dosyanın varlığı aktif GitHub test iş akışı olduğu anlamına gelmez.

Örnek veri dosyası `samples/eksibellek-test-20-yazar.json`: 20 temsili yazar, 28 not (20 aktif, 5 arşiv, 3 çöp kutusu), 4 geçmiş kaydı. Hepsi `test` etiketlidir; tekrar içe aktarma yeni eşdeğer not oluşturmaz.

## 6. Yayın ve herkese açık kimlikler

| Başlık | Son doğrulanan değer |
| --- | --- |
| Sürüm | `0.1.9` |
| GitHub | https://github.com/togiwan/eksibellek |
| Dal ve sürüm | `main`, `v0.1.9` |
| İlk genel sürüm kod commit'i | `48174820faa7363974ebe6ae3f8323b975a06e11` |
| İndirilebilir paket | https://github.com/togiwan/eksibellek/releases/tag/v0.1.9 |
| Proje sitesi | https://togiwan.github.io/eksibellek/ |
| Gizlilik | https://togiwan.github.io/eksibellek/privacy.html |
| Destek | https://github.com/togiwan/eksibellek/issues |
| Lisans | MIT, telif bildirimi `togiwan` |
| Mağaza yayıncısı | Ombryn |
| Açık destek e-postası | ombrynofficial@gmail.com |
| Chrome Web Store öğesi | `pdjlhiljfimgkfeeliipmphdbdhjneia` |

**Mağazada son görülen durum: 2 Kasım 2026'da `Pending review`.** Gönderim başarı ekranıyla doğrulandı; inceleme başarılı olursa otomatik yayımlama seçildi. Bu kayıt Google onayı verildiği veya mağazanın canlı olduğu anlamına gelmez. Bir sonraki görüşmede güncel durum panelden doğrulanmalı.

Kullanıcı geliştirici kayıt ücretini ödedi, iki adımlı doğrulamayı etkinleştirdi ve iletişim e-postasını doğruladı. Yayıncı adı/e-postası kullanıcı tarafından seçildi. Ticari olmayan hesap, bağışın otomatik muafiyet sağlamadığı açıklanıp kullanıcının projenin hobi faaliyeti olduğunu açıkça belirtmesinden sonra seçildi; yeni bir hukuki sınıflandırma varsayımı yapma.

Dağıtım ücretsiz, herkese açık ve tüm desteklenen bölgeler şeklinde ayarlandı. Yerel işleme dahil rumuz/kimlik, site içeriği ve nota eklenen kaynak URL/başlığı açıklandı. Uzaktan kod yok beyanı yapıldı. Ayrıntılı mağaza metinleri ve incelemeci adımları `docs/chrome-web-store.md` içindedir.

Yayımlanan ZIP SHA-256:

`e335d29cafa1d6b07ddb6b9fd9c0ad2c12dc0d0e4fd9e32d9d0f36ef2f7776be`

GitHub varlık hash'i yerel ZIP ile karşılaştırıldı. Kaynak kodu sürüm etiketiyle aynı kaldı; sonraki commitler belge/görsel değişiklikleriydi. Mevcut paketlenmemiş kurulum klasörü adı farklı bir sürüm içerebilir; klasörü yeniden adlandırmadan içeriğini doğrula.

### Gönüllü destek

TRX ve USDT için kullanıcı **aynı adresin ikisinin de TRON cüzdanı olduğunu** doğruladı:

`TFkvdWvfMF7sPuLaC7ejkdyCmzWiJJ4Aeq`

TRX etiketi TRON, USDT etiketi TRON/TRC20'dir. Adresin Base58Check kontrol toplamı doğrulandı. Kullanıcı bakiyesi/işlemleri okunmaz; cüzdana bağlanılmaz; uygulama transfer başlatmaz. Pano yalnızca kullanıcı düğmeye tıklayınca bu adresle yazılır; pano okunmaz.

### Gerçek sözlük görüntüleri

`docs/assets/store/screenshot-eksi-page.png`, `screenshot-eksi-note.png` ve `screenshot-eksi-add.png` gerçek, herkese açık bir kitap önerileri başlığında alındı. Görünen not ayrı geçici profilde tanıtım için oluşturuldu; kişisel notlar kullanılmadı. GitHub README'de bu üç ekran var; mağazanın ilk iki görseli gerçek not kutusu ve not ekleme formudur. Proje sitesinde de gerçek not kutusu gösterilir. GitHub deposunun özel “Social preview” ayarının tamamlandığı iddia edilmemeli; site paylaşım metaverisi ve görseli hazırlanmıştır.

### Kişisel bilgi kontrolü

Yayın sonrasında beş commit'in geçmişi, dosyalar, iki yerel ZIP ve görsel metaverileri tarandı. Gerçek ad-soyad, kişisel e-posta, yerel kullanıcı yolu, cihaz kimliği veya IPv4 izi bulunmadı. Canlı site/gizlilik sayfası ve GitHub'ın açık profil alanları da kontrol edildi; profilde ad/e-posta/konum alanları boştu. Bu geçmiş kontrol gelecek değişiklikleri kapsamaz; yeni yayımlanacak içeriği de kontrol et.

Bilerek açık tutulan bağlantılar GitHub `togiwan`, yayıncı `Ombryn`, destek e-postası ve bağış adresidir. Tam anonimlik iddiası verilmedi. Commitler `togiwan <75915770+togiwan@users.noreply.github.com>` kimliğiyle oluşturuldu. Bilgisayara özel yollar bu belge dahil açık dosyalara yazılmamalı.

## 7. Buradan sonra yapılacaklar

Öncelik sırası, mevcut onaylanmış yayın sürecini tamamlamaktır:

1. Kullanıcı yeniden devam istediğinde mevcut Web Store öğesinin güncel durumunu kontrol et. Kullanıcı istemeden incelemeyi iptal etme, yeni mağaza öğesi oluşturma veya otomatik izleme sözü verme.
2. Google ek bilgi/red gerekçesi verirse gerçek bildirimi oku; yalnızca gereken değişikliği uygula, uygun testleri çalıştır, sürümü yükselt ve **aynı öğeye** yükle.
3. Onay ve canlı mağaza bağlantısı doğrulanınca README, proje sitesi ve sürüm notlarında “incelemede” metnini güncelle; mağazadan kurulumu anlat.
4. Kullanıcının paketlenmemiş kurulumundaki notları **önce JSON dışa aktar**, mağaza kurulumunda içe aktar, yazar/not/çöp kutusu/geçmiş sayılarını doğrula. Veri doğrulanmadan eski kurulumu kaldırma. Mağaza ve paketlenmemiş kurulumun depolamasının otomatik ortak olduğu varsayılmamalı.
5. Gerçek kullanım geri bildirimlerine göre hataları ve okunabilirliği düzelt; temel veri koruma ve gizlilik kararlarını koru.

Bulut eşitleme, otomatik dış yedekleme, şifreleme/parola, farklı siteler, ek bağış sağlayıcıları veya yeni ücretli özellikler **onaylanmış sonraki işler değildir**. Bunları mevcut kapsam ya da söz verilmiş yol haritası gibi uygulama.

## 8. Bu kaydı güncel tutma

Her önemli çalışmadan sonra bu belgeye kesinleşen kararları, değişen sürüm/yayın durumunu, yapılan doğrulamayı ve açık kalan işi işle. Ayrıntılı sürüm değişiklikleri `CHANGELOG.md`, kurulum/kullanım `README.md`, veri uygulamaları `PRIVACY.md`, mağaza form metinleri `docs/chrome-web-store.md` içinde kalır. Durumla ilgili varsayım yerine son doğrulama tarihini ve kanıtın sınırını belirt.
