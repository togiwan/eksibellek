# Katkıda bulunma

Hata veya öneri için GitHub Issues kullanabilirsin. Tekrarlama adımlarını, Chrome ve EkşiBellek sürümünü belirt. Kişisel notlarını veya gerçek yedeğini paylaşman gerekmez; temsili örnek kullan.

Geliştirmede `extension/` klasörünü ayrı bir Chrome profiline paketlenmemiş eklenti olarak yükle. `npm test`, `npm run check` ve `npm run package` komutlarını çalıştır.

## Veri koruma kuralları

- Kalıcı işlemler `background.js` içindeki tek kuyruktan geçer; depolama yazımı tamamlanmadan başarı dönülmez.
- Mevcut veri anahtarları (`eksi-defter-v1`, taslak anahtarı), mesaj kanalı ve yedek kimliği geriye uyumluluk için korunur.
- Var olan geçersiz veri boş kurulum olarak yorumlanmaz; üzerine boş liste yazılmaz.
- Tek notta sürüm, toplu işlemlerde seçim/sürüm kontrolünü koru.
- Yedek içe aktarma atomiktir; bozuk dosya mevcut kaydı değiştirmemelidir.
- Kullanıcı metni HTML veya kod olarak çalıştırılmaz. Yeni ağ istekleri/izinler eklenirse gizlilik açıklamasını da güncelle.
- ZIP'e yalnızca eklenti varlıkları ve lisans girer; kullanıcı yedeği veya test profili girmez.

PR'da sorunu, değişen davranışı ve yaptığın doğrulamayı açıkla. Katkılar projenin MIT lisansı altında sunulur.
