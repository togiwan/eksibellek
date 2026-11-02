# EkşiBellek — çalışma talimatları

## Önce bağlamı oku

Yeni bir oturumda veya bu projeye devam ederken önce `PROJECT_CONTEXT.md` dosyasını oku. Ürün vizyonu, kullanıcının kesinleşmiş tercihleri, tamamlanan işler, son doğrulanan yayın durumu ve sonraki adımlar oradadır. İlgili ayrıntı için `README.md`, `CHANGELOG.md`, `PRIVACY.md`, `CONTRIBUTING.md` ve `docs/chrome-web-store.md` dosyalarını kullan.

Kullanıcıdan bu belgelerde zaten bulunan kararları tekrar anlatmasını isteme. Belgelerdeki geçmiş bir yayın/test durumunu güncel durum olarak sunmadan önce ilgili kodu veya platformu doğrula. Önemli karar, tamamlanan iş veya yayın durumu değişince `PROJECT_CONTEXT.md` dosyasını da güncelle; önerileri yapılmış iş gibi kaydetme.

## Ürün ve veri koruma

- İsim **EkşiBellek**. Ücretsiz, açık kaynak ve MIT lisanslıdır. Destek tamamen gönüllüdür.
- En önemli gereksinim kayıtların korunmasıdır. Kullanıcının gerçek Chrome profiline, notlarına veya yedeklerine test verisi yazma; testleri ayrı, geçici profillerde yap.
- Kalıcı veri anahtarı `eksi-defter-v1`, taslak anahtarı `eksi-defter-draft`, mesaj kanalı `eksi-defter`, port adı `defter-updates` ve yedek kimliği `eksi-defter` uyumluluk için korunur. Önceki ürün adı geçen bu kimlikleri kozmetik bir yeniden adlandırmayla değiştirme.
- Kalıcı değişiklikler arka plandaki seri kuyruktan geçer. `storage.local.set` tamamlanmadan başarı dönme. Mevcut bozuk veriyi boş kurulum sayıp üzerine yazma.
- Not sürümü ve toplu seçim kontrollerini, atomik içe aktarmayı, geçmişi ve çöp kutusunu koru. Çöp kutusunu kendiliğinden boşaltma.
- Paketlenmemiş kurulumun klasörünü taşıma/yeniden adlandırma. Mevcut klasörü güncellemeden önce içeriğini doğrula. Mağaza sürümüne/farklı profile geçişte JSON dışa/içe aktarma gerekir.

## Arayüz ve kapsam

- Not düğmesi kullanıcı adının **başında**, aynı satırda kalır.
- Gerçek Chrome ikon penceresi için statik `popup-document` başlangıç boyutu 420 × 600'dür. Genişliği başlangıçta `100vw` ile küçülen bir düzene geri döndürme. İçerik ana alanda kayar; dört üst sekme hizalı kalır.
- Destek ekranı Ayarlar altındadır. TRX ağı TRON; USDT ağı TRON/TRC20. Onaylanmış alıcı adresini kullanıcı istemeden değiştirme.
- Türkçe, özenli ve dengeli mevcut tasarımı koru. Pazarlama ekranlarında gerçek Ekşi Sözlük üzerindeki görünümü göster; temsili sayfayı gerçek site gibi sunma.
- Çalışma zamanı bağımlılığı, sunucu, analitik veya yeni izin eklemek ürün/gizlilik kapsamı değişikliğidir; mevcut özellik gibi varsayma.

## Gizlilik ve yayın

- Herkese açık dosyalara gerçek ad-soyad, kişisel e-posta, bilgisayar kullanıcı adı/yolu, cihaz kimliği, hesap sırrı, gerçek not veya kişisel yedek ekleme. Geçici test çıktıları ve işletim sistemi dosyaları yayımlanmaz.
- Kararlaştırılmış açık kimlikler: GitHub `togiwan`, yayıncı `Ombryn`, destek `ombrynofficial@gmail.com` ve uygulamadaki gönüllü TRON alıcı adresi.
- Commit kimliği `togiwan <75915770+togiwan@users.noreply.github.com>` olmalı; kişisel global Git kimliğine güvenme. Kimliği bu repo/komut ile sınırla.
- ZIP yalnızca `extension/` varlıklarını ve lisansı içerir. Kayıtlar, örnekler, test profilleri ve bilgisayar yolları pakete giremez.
- Runtime kodu değiştiğinde uygun testleri ve `npm run check` komutunu çalıştır; paket yayımlanacaksa `npm run package` ile üretip kaynakla karşılaştır. Yalnızca belge değişiklikleri için gereksiz tarayıcı/kalıcılık testlerini tekrarlama.
- `Pending review`, mağazada yayımlanmış olmak değildir. Yeni bir mağaza öğesi oluşturmak yerine mevcut öğenin durumunu kontrol et. İncelemeyi kullanıcı istemeden iptal etme.
