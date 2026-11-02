# Chrome Web Store yayın dosyası

Paket: `dist/eksibellek-0.1.9.zip` · Dil: Türkçe · Kategori: Productivity / Tools (paneldeki karşılığı) · Ücret: Ücretsiz.

GitHub: https://github.com/togiwan/eksibellek

Ana sayfa: https://togiwan.github.io/eksibellek/

Gizlilik: https://togiwan.github.io/eksibellek/privacy.html

Destek: https://github.com/togiwan/eksibellek/issues

Yayıncı: Ombryn · İletişim: ombrynofficial@gmail.com

## Ayrıntılı açıklama

EkşiBellek, Ekşi Sözlük yazarları hakkında kendine özel notlar tutmanı sağlar. Bir yazarı başka bir başlıkta yeniden gördüğünde, kullanıcı adının başındaki küçük düğmeyle önceki notlarını açabilirsin.

• Bir yazara birden fazla tarihli not ekle.
• Etiket ve renklerle düzenle; kullanıcı adı, not veya etikette ara.
• Kaynak entry bağlantısını sakla; düzenleme geçmişinden önceki metinleri gör.
• Notlarını arşivle veya geri alınabilir çöp kutusuna taşı.
• Çöp kutusundan geri getir; kalıcı silme için ayrıca onay ver.
• Yazarlarını, notlarını, arşivi, çöp kutusunu ve geçmişi JSON ile dışa/içe aktar.
• İçe aktarmadan önce yeni, aynı ve çakışan kayıtları kontrol et.
• Açık, koyu veya sistem temasını kullan.

Verilerin sende kalır
Notların aynı Chrome profilinin yerel eklenti depolamasında saklanır; geliştiriciye veya bir sunucuya gönderilmez. Hesap, analitik, reklam veya otomatik bulut senkronizasyonu yoktur. Normal tarayıcı kapatma/açmada kayıtlar korunur.

Yedek al
Eklentiyi kaldırmak veya Chrome profilini silmek yerel kayıtları siler. Düzenli JSON yedeği al; indirilen dosya notları açık metin olarak içerir. Başka profile veya farklı eklenti kurulumuna geçerken JSON dışa/içe aktarma kullan.

Ücretsiz ve açık kaynak
EkşiBellek MIT lisanslıdır. Ayarlar bölümündeki TRX ve USDT/TRC20 destek adresleri tamamen gönüllüdür; hiçbir özelliği açmak için ödeme gerekmez. Eklenti cüzdanına bağlanmaz ve transfer başlatmaz.

Yalnızca eksisozluk.com ve www.eksisozluk.com HTTPS sayfalarında çalışır. EkşiBellek, Ekşi Sözlük'ün resmî ürünü değildir ve onunla bağlantılı değildir.

Kaynak kodu: https://github.com/togiwan/eksibellek
Gizlilik: https://togiwan.github.io/eksibellek/privacy.html
Destek: https://github.com/togiwan/eksibellek/issues

## Tek amaç açıklaması

Ekşi Sözlük yazarları için kullanıcının kendi cihazında kişisel not tutmasını ve aynı yazarla farklı başlıklarda karşılaştığında bu notları görmesini sağlamak. Etiket, arşiv, çöp kutusu ve JSON yedekleme bu notları yönetmek içindir.

## storage izni gerekçesi

Kullanıcının yazar notlarını, etiketlerini, düzenleme geçmişini, arşiv/çöp kutusunu, görünüm tercihlerini ve yeni not taslağını aynı Chrome profilinde kalıcı ve yerel olarak saklamak için kullanılır. Veriler bir sunucuya gönderilmez ve senkronize edilmez.

## Site erişimi gerekçesi

https://eksisozluk.com/* ve https://www.eksisozluk.com/* üzerinde sayfada görünen yazar rumuzunu, varsa sayısal yazar kimliğini ve ilgili entry bağlantısı/başlığını okumak; yazar adının başına not düğmesini yerleştirmek; kullanıcı tıkladığında o yazara ait yerel notları eklenti çerçevesinde göstermek için gereklidir. Diğer siteler veya genel tarayıcı geçmişi okunmaz.

## Uzaktan kod

Hayır. JavaScript, HTML, CSS ve ikonların tamamı pakette bulunur. Uzaktan betik, eval, dış servis çağrısı veya çalışma zamanı bağımlılığı yoktur. Haricî proje/gizlilik/destek ve kaynak bağlantıları yalnızca kullanıcı tıklayınca normal sekmede açılır.

## Veri kullanımı beyanı

Yerel işleme de Google'ın veri işleme tanımına dahildir. Panelde şu kategoriler açıklanan işlevlerle ilişkilidir:

- Personally identifiable information: yazar rumuzu ve varsa sayısal kullanıcı kimliği.
- Website content: kullanıcı notları, etiketler ve kaynak başlıkları.
- Web history: yalnızca kullanıcının nota kaynak olarak eklediği entry URL/başlığı; genel gezinme geçmişi toplanmaz.

Veri satılmaz; uzantının kişisel not amacı dışındaki kullanımlar için aktarılmaz; kredi değerliliği veya borç verme için kullanılmaz. Bağış adresi geliştiriciye aittir; kullanıcı ödeme verisi/cüzdan bakiyesi okunmaz. Sağlık, kimlik doğrulama, konum, kullanıcı etkinliği veya finansal veri toplamaya yönelik özellik yoktur.

## İncelemeci test adımları

1. Giriş veya abonelik gerekmez. https://eksisozluk.com/ adresinde bir başlık açın.
2. Her entry yazarının adının başındaki küçük not düğmesine tıklayın. “Mağaza testi” metniyle bir not kaydedin. Aynı yazarın düğmesi not sayısını göstermelidir.
3. Eklenti ikonunu açın. Yazarlar ekranında notu bulun, düzenleyin ve geçmişi kontrol edin. Genişletme düğmesi tüm defteri ayrı sekmede açar.
4. Notu Sil ile çöp kutusuna taşıyın. Yazarlar > Çöp kutusu ile Geri getir'i deneyin. Kalıcı silme ayrıca onay ister.
5. Yedekleme ekranından JSON indirin; aynı dosyayı tekrar seçip önizlemede eşdeğer notların çoğalmadığını doğrulayın.
6. Chrome'u tamamen kapatıp aynı profilde açın; kayıt korunmalıdır. Eklentiyi kaldırmak testin bu adımında kullanılmamalıdır.
7. Ayarlar > Destek seçenekleri ekranında iki TRON adresi gösterilir. Kopyalama ücretsizdir; gerçek transfer veya cüzdan bağlantısı gerekmez.

Örnek veri: https://github.com/togiwan/eksibellek/blob/main/samples/eksibellek-test-20-yazar.json

## Görseller

- `extension/icons/128.png`: 128 × 128 ikon.
- `docs/assets/store/screenshot-library.png`: 1280 × 800 gerçek yazar listesi.
- `docs/assets/store/screenshot-note.png`: 1280 × 800, temsili başlıkta gerçek içerik betiği ve not çerçevesi.
- `docs/assets/store/screenshot-trash.png`: 1280 × 800 gerçek çöp kutusu.
- `docs/assets/store/promo-small.png`: 440 × 280 küçük tanıtım görseli.

Görseller yalnızca temsili yazarlar/notlar içerir; kişisel test profilinden veri alınmaz.
