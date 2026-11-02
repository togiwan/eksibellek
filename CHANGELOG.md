# Değişiklik geçmişi

## 0.1.9 — 2 Kasım 2026

- İlk genel yayın için MIT lisansı ve kaynak kodu/gizlilik/destek bağlantıları eklendi.
- Mağaza açıklamaları, tanıtım görselleri ve herkese açık gizlilik sayfası hazırlandı.
- Pakete lisans bildirimi eklendi; mevcut kayıt anahtarları ve yedek biçimi korundu.

## 0.1.8 — 2 Kasım 2026

- Ayarlar üzerinden açılan gönüllü kripto destek ekranı eklendi.
- TRX (TRON) ve USDT (TRON/TRC20) için alıcı adresi ve kopyalama düğmeleri eklendi.
- Destek ekranı açık/koyu temaya ve ikon penceresine uyar; ek izin veya cüzdan bağlantısı istemez.

## 0.1.7 — 2 Kasım 2026

- Tek not ve yazarın tüm notları için geri alınabilir silme eklendi.
- Çöp kutusu, önceki aktif/arşiv durumuna geri getirme ve onaylı kalıcı silme/boşaltma eklendi.
- Silinen notlar sayfadaki sayaçlardan ve aktif/arşiv listelerinden çıkarılır.
- Çöp kutusu notları ve geçmişleri yeni v2 JSON yedeklerinde korunur; eski v1 yedekler desteklenir.
- Eski ekranlardan yapılan toplu işlemler sürüm kontrolüyle reddedilir.

## 0.1.6 — 2 Kasım 2026

- Var olan bozuk depolama değeri artık yeni kurulum kabul edilmez; boş listeyle üzerine yazılması engellenir.
- Başlangıç kayıt meta verileri doğrulanır; okuma hatalarında kayıtlar korunur.
- Kalıcı yazma tamamlanmadan başarı dönülmediğini ve bozuk verinin korunmasını denetleyen regresyon testleri eklendi.

## 0.1.5 — 2 Kasım 2026

- Uygulamanın adı EkşiBellek olarak güncellendi.
- Chrome adı, araç çubuğu başlığı, arayüz, HTML başlıkları ve dokümanlar yeni adla eşleştirildi.
- Yeni ZIP ve dışa aktarılan yedek dosyaları `eksibellek` adını kullanır.
- Mevcut kurulum yolu, veri anahtarları ve JSON yedek biçimi uyumluluk için korundu.

## 0.1.4 — 2 Kasım 2026

- “İlk notunu ekle” düğmesinde metni kaydıran görünmez ikon kaldırıldı.
- Boş ekranın büyük ikon stili yalnızca üstteki çizime uygulandı; düğme metni iki eksende ortalandı.

## 0.1.3 — 2 Kasım 2026

- İkon penceresi için ayrı, başlangıç boyutları statik olarak tanımlanmış HTML giriş sayfası eklendi.
- Görüntü alanına bağlı genişlik sınırı kaldırıldı; Chrome araç çubuğu penceresi ilk yüklemeden itibaren 420 piksel genişlik ister.
- Ekran yüksekliği kısıtlıysa içerik alanı kullanılabilir yüksekliğe uyum sağlar.

## 0.1.2 — 2 Kasım 2026

- Dar ikon pencerelerinde menü sekmelerinin sağa taşması düzeltildi.
- 340 piksel ve altındaki pencerelerde sekmeler eşit genişlikte iki satırda gösterilir; geniş pencerelerde tek satır korunur.

## 0.1.1 — 2 Kasım 2026

- Not simgesi kullanıcı adının başına taşındı; blok bağlantılarda da aynı satırda tutulur.
- Açılan not kutusu içeriğe göre boyutlanır; uzun içerik kutu içinde kaydırılır.
- İkon penceresinde eşit sekmeler, tek kaydırma alanı ve daha dengeli form düzeni.
- Etiket/renk ve kaynak seçenekleri açılır bölümlerde toplandı.
- Not kartları, yazı boyutları, düğme ve filtre hizaları tüm ekranlarda tutarlı hale getirildi.
- İkon penceresinde yazar listesi ile yazar ayrıntısı ayrı ekranlarda tutuldu; geri dönüş eklendi.

## 0.1.0 — 2 Kasım 2026

- Kişisel Chrome test sürümü; Manifest V3, sunucusuz yerel depolama.
- Yazarların yanında not düğmeleri ve eklenti kökeninde not kutusu.
- Çoklu notlar, kaynaklar, etiketler, renkler ve düzenleme geçmişi.
- Arama, sıralama, arşiv ve geri getirme.
- Önizlemeli, çakışmaları koruyan JSON içe aktarma ve dışa aktarma.
- Çoklu pencere kayıt kuyruğu ve not sürümü kontrolü.
- Açık/koyu/sistem teması, ikon penceresinde yeni not taslağı.
