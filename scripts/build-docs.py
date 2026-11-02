"""Build static public project/privacy pages from the canonical privacy text."""
from pathlib import Path
import html
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
(DOCS / 'assets').mkdir(parents=True, exist_ok=True)
shutil.copyfile(ROOT / 'extension/icons/128.png', DOCS / 'assets/icon.png')

def inline(text):
    text = html.escape(text)
    text = re.sub(r'\[([^\]]+)\]\((https://[^)]+)\)', r'<a href="\2">\1</a>', text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    return text

def markdown(text):
    blocks = []
    for block in text.strip().split('\n\n'):
        if block.startswith('# '):
            blocks.append('<h1>' + inline(block[2:]) + '</h1>')
        elif block.startswith('## '):
            blocks.append('<h2>' + inline(block[3:]) + '</h2>')
        elif block.startswith('- '):
            blocks.append('<ul>' + ''.join('<li>' + inline(line[2:]) + '</li>' for line in block.splitlines()) + '</ul>')
        else:
            blocks.append('<p>' + inline(block.replace('\n', ' ')) + '</p>')
    return '\n'.join(blocks)

header = '''<header class="site-header"><a class="brand" href="./"><img src="assets/icon.png" width="36" height="36" alt="">EkşiBellek</a><nav aria-label="Site menüsü"><a href="privacy.html">Gizlilik</a><a href="https://github.com/togiwan/eksibellek">GitHub ↗</a></nav></header>'''
footer = '''<footer><span>© 2026 Ombryn · <a href="https://github.com/togiwan/eksibellek/blob/main/LICENSE">MIT lisansı</a></span><span><a href="mailto:ombrynofficial@gmail.com">İletişim</a> · <a href="https://github.com/togiwan/eksibellek/issues">Destek</a></span><p>EkşiBellek, Ekşi Sözlük’ün resmî ürünü değildir ve onunla bağlantılı değildir.</p></footer>'''
def page(title, body, cls=''):
    return f'''<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Ekşi Sözlük yazarları için ücretsiz, açık kaynak ve yerel kişisel notlar."><title>{title}</title><link rel="icon" href="assets/icon.png"><link rel="stylesheet" href="styles.css"></head><body class="{cls}">{header}{body}{footer}</body></html>'''

privacy = markdown((ROOT / 'PRIVACY.md').read_text())
(DOCS / 'privacy.html').write_text(page('EkşiBellek — Gizlilik', '<main class="policy">' + privacy + '</main>'))
(DOCS / 'index.html').write_text(page('EkşiBellek — Yazarları hatırla.', '''<main>
<section class="hero"><span class="eyebrow">EKŞİ SÖZLÜK İÇİN KİŞİSEL NOTLAR</span><h1>Yazarları hatırla.<br><span>Notların yanında kalsın.</span></h1><p>Bir yazara not bırak. Başka bir başlıkta yeniden karşılaştığında, kullanıcı adının başındaki küçük düğmeden hatırla.</p><div class="badges"><span>Ücretsiz</span><span>Yerel kayıt</span><span>Açık kaynak</span></div><div class="hero-actions"><a class="button" href="https://github.com/togiwan/eksibellek/releases/latest">Son sürümü indir ↗</a><a class="button secondary" href="https://github.com/togiwan/eksibellek">Kaynak kodunu incele ↗</a></div><p class="status">Chrome Web Store başvurusu hazırlanıyor. ZIP kurulum adımları GitHub sayfasında.</p></section>
<figure class="product"><img src="assets/store/screenshot-library.png" alt="EkşiBellek yazar listesi, etiketler ve not kartları" width="1280" height="800"><figcaption>Örnek yazarlar ve notlarla gerçek eklenti arayüzü.</figcaption></figure>
<section class="features" aria-label="Özellikler"><article><span class="feature-number">01</span><h2>Okurken not al.</h2><p>Yazar adının başındaki düğme, notlarını bir tıkla açar. Etiket, renk ve kaynak ekleyebilirsin.</p></article><article><span class="feature-number">02</span><h2>Defterin sende.</h2><p>Notların Chrome profilinde kalır. Hesap, reklam veya notlarını alan bir sunucu yoktur.</p></article><article><span class="feature-number">03</span><h2>Geri dön, geri getir.</h2><p>Geçmiş, arşiv, çöp kutusu ve JSON yedekleriyle kayıtlarını sen yönetirsin.</p></article></section>
<section class="backup-note"><h2>Kayıtlarını yedekle.</h2><p>Normal tarayıcı kapatma/açmada notların korunur. Eklentiyi kaldırmak veya profili silmek yerel kayıtları siler; düzenli JSON yedeği al. Paketlenmemiş kurulumdan mağaza sürümüne geçerken de JSON dışa/içe aktarma kullan.</p><a href="privacy.html">Verilerin nasıl tutulduğunu oku ↗</a></section>
</main>'''))
(DOCS / '.nojekyll').write_text('')
print('Built docs/index.html and docs/privacy.html')
