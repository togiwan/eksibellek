# EkşiBellek — Gizlilik ve yerel veri açıklaması

Son güncelleme: 2 Kasım 2026 · Sürüm: 0.1.9

## Geliştirici ve iletişim

EkşiBellek, [togiwan](https://github.com/togiwan) tarafından geliştirilen ücretsiz, MIT lisanslı bir Chrome eklentisidir. Sorular için [projenin destek sayfasını](https://github.com/togiwan/eksibellek/issues) kullanabilirsin. Destek talebine kişisel notlarını veya gerçek yedeğini eklemen gerekmez.

## Hangi veriler işlenir?

- Kullanıcının girdiği yazar rumuzları, notlar, etiketler, renkler, not tarihleri, düzenleme geçmişi, arşiv ve çöp kutusu durumları.
- Ekşi Sözlük sayfasında görünen yazar rumuzu ve varsa sayısal yazar kimliği; bunlar doğru yazarın notlarını göstermek için kullanılır.
- Kaynak özelliği için ilgili entry kimliği, kaynak bağlantısı ve başlığı. Kaynak bilgisi nota eklenebilir; genel tarayıcı geçmişi taranmaz veya kaydedilmez.
- Açık/koyu tema, yedekleme hatırlatma tercihi, dışa aktarma tarihi/sürüm bilgisi ve yeni not taslağı.

## Veriler nerede tutulur ve paylaşılır mı?

Notlar, taslaklar ve tercihler aynı Chrome profilinin yerel eklenti depolamasında saklanır. Eklenti bunları geliştiriciye, bir sunucuya veya üçüncü kişiye göndermez. Analitik, reklam, kullanıcı hesabı, otomatik bulut senkronizasyonu ve ödeme entegrasyonu yoktur. Eklentinin içerik güvenlik politikası uzaktan kodu ve ağ bağlantılarını engeller.

Sayfadaki küçük düğmeler yalnızca not sayısını ve işaret rengini alır. Not metinleri sitenin DOM'una düz metin olarak eklenmez; eklenti kökenindeki ayrı çerçevede açılır. Aynı bilgisayarı ve Chrome profilini kullanan kişilere karşı ek parola koruması veya disk şifrelemesi sağlanmaz.

Kullanıcının tıkladığı kaynak/profil bağlantıları Ekşi Sözlük'ü; kaynak kodu, gizlilik ve destek bağlantıları GitHub/GitHub Pages'i normal sekmede açar. Bu siteleri ziyaret etmek ilgili sitenin koşullarına tabidir. Bu sayfalara not içeriği veya kullanıcı yedeği otomatik eklenmez.

## Saklama, silme ve yedekleme

Normal tarayıcı kapatma/açmada kayıtlar korunur. Eklenti kayıtları otomatik olarak süre aşımına uğratmaz. Kullanıcı notlarını düzenleyebilir, arşivleyebilir veya geri alınabilir çöp kutusuna taşıyabilir. Çöp kutusu otomatik boşalmaz. Ayrıca onay vererek tek bir notu kalıcı silmek veya çöp kutusunu boşaltmak mümkündür; bu işlem ilgili düzenleme geçmişini de kaldırır.

Eklentiyi kaldırmak veya Chrome profilini silmek yerel kayıtları siler. Depolama kotası dolarsa son işlem reddedilir ve önceki kayıt korunur. Düzenli yedek almak kullanıcının kontrolündedir.

JSON dışa aktarma kullanıcı tarafından başlatılır ve yazarları, notları, kaynakları, arşivi, çöp kutusunu ve geçmişi açık metin içerir. Dosyanın nerede tutulacağı ve kiminle paylaşılacağı kullanıcıya aittir. İçe aktarılan dosya biçim ve bağlantı açısından doğrulanır; içeriği kod veya HTML olarak çalıştırılmaz. Kalıcı silme, daha önce dışa aktarılmış kopyaları etkilemez; bu dosyalar ayrıca kullanıcı tarafından yönetilir.

## İzinler

İstenen tek API izni `storage` iznidir; kayıtların kalıcı ve yerel tutulması için kullanılır. İçerik betiği yalnızca `https://eksisozluk.com/*` ve `https://www.eksisozluk.com/*` üzerinde yazar düğmelerini gösterir ve not eşleştirmesi yapar. Tüm sitelere erişim, çerezler, kimlik bilgileri veya genel tarayıcı geçmişi izni istenmez.

## Gönüllü kripto destek ve pano

Destek ekranı, geliştiricinin herkese açık TRON alıcı adresini TRX ve USDT/TRC20 için gösterir. Kopyalama düğmesi yalnızca açıkça tıklandığında bu adresi panoya yazar; kullanıcının panosu okunmaz. Eklenti cüzdana bağlanmaz, transfer başlatmaz, bakiye okumaz ve işlem takibi yapmaz. Kullanıcı kendi cüzdanından gönderim yaparsa işlem ilgili blokzincirin herkese açık kayıtlarında yer alır; not verileri bu işleme eklenmez.

## Sınırlı kullanım

EkşiBellek verileri yalnızca yukarıda açıklanan kişisel not, eşleştirme ve yedekleme özellikleri için kullanır. Veriler satılmaz, reklam için kullanılmaz, ilgisiz amaçlarla aktarılmaz veya kredi değerliliği/borç verme kararlarında kullanılmaz. Bu kullanım, Chrome Web Store Kullanıcı Verileri Politikası'nın Sınırlı Kullanım şartlarıyla uyumlu olacak şekilde tasarlanmıştır.

Gizlilik uygulamaları değişirse bu açıklama ve sürüm notları güncellenir. EkşiBellek, Ekşi Sözlük'ün resmî ürünü değildir.
