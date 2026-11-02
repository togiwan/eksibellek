// Development-only: capture real extension screens with isolated, fictional data.
// Browser plugin not available for loading extensions; use local Playwright/Chromium.
import {mkdtemp,rm,mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const spec=process.env.PLAYWRIGHT_MODULE||'playwright';
const {chromium}=await import(spec.startsWith('/')?pathToFileURL(spec).href:spec);
const extension=fileURLToPath(new URL('../extension/',import.meta.url));
const output=fileURLToPath(new URL('../docs/assets/store/',import.meta.url));
const profile=await mkdtemp(join(tmpdir(),'eksibellek-store-assets-'));
await mkdir(output,{recursive:true});
const errors=[];let context;
try{
 context=await chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`],viewport:{width:1280,height:800},deviceScaleFactor:1,colorScheme:'light'});
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 const sw=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
 const origin=`chrome-extension://${new URL(sw.url()).host}`;
 const app=await context.newPage();await app.goto(origin+'/pages/app.html');await app.getByRole('heading',{name:'Kayıtlı yazarlar',exact:true}).waitFor();
 async function rpc(op,payload={}){const r=await app.evaluate(m=>chrome.runtime.sendMessage({channel:'eksi-defter',...m}),{op,payload});assert(r.ok,r.error);return r.value;}
 const authors=[
 ['örnek gezgin','900001','green','gezi, kaynak','Şehir yürüyüşleriyle ilgili notlarımı bu yazarda topluyorum. Verilen kaynaklara tekrar bak.'],
 ['örnek okur','900002','blue','kitap, tekrar oku','Kitap önerilerini karşılaştırmak için bu yazarı hatırla.'],
 ['örnek meraklı','900003','amber','bilim, kaynak','Bilim başlıklarındaki kaynak listelerini daha sonra okumak için kaydet.'],
 ['örnek dinleyici','900004','rose','müzik','Albüm önerilerini dinledikten sonra kendi gözlemini ekle.'],
 ['örnek geliştirici','900005','slate','teknoloji','Teknik açıklamaları okurken bağlantılı belgeleri kontrol et.'],
 ['örnek sinemasever','900006','green','sinema','Film önerileri için tuttuğum kişisel hatırlatma.']
 ];
 for(const [username,authorId,color,tags,text] of authors)await rpc('add',{username,authorId,color,tags,text});
 let state=await rpc('get');let author=state.authors[0];let note=author.notes[0];
 await rpc('edit',{username:author.username,authorId:author.authorId,noteId:note.id,expectedVersion:note.version,text:note.text+'\n\nYeni not: Yürüyüş rotasını hafta sonu denemeden önce güncel bilgileri kontrol et.'});
 await rpc('add',{username:author.username,authorId:author.authorId,text:'Aynı yazarla başka bir başlıkta karşılaşırsam önceki notlarıma buradan dönebilirim.'});
 for(const [name,id,text,operation] of [
 ['örnek gezgin','900001','Eski rota notu. Arşivde saklanıyor.','archive'],
 ['örnek gezgin','900001','Bu deneme notunu çöp kutusundan geri getirebilirim.','trash'],
 ['örnek okur','900002','Silinen bir not, ayrıca onay vermeden kalıcı olarak kaldırılmaz.','trash']]){
  await rpc('add',{username:name,authorId:id,text});state=await rpc('get');author=state.authors.find(a=>a.username===name);note=author.notes[0];await rpc(operation,{username:name,authorId:id,noteId:note.id,expectedVersion:note.version});
 }
 await app.getByRole('button',{name:'örnek gezgin — 2 not',exact:true}).click();
 await app.screenshot({path:join(output,'screenshot-library.png')});
 await app.getByRole('navigation').getByRole('button',{name:'Çöp kutusu',exact:true}).click();await app.getByRole('heading',{name:'Çöp kutusu',exact:true}).waitFor();
 await app.screenshot({path:join(output,'screenshot-trash.png')});
 const fixture=`<!doctype html><html lang="tr"><meta charset="utf-8"><title>EkşiBellek — örnek başlık</title><style>*{box-sizing:border-box}body{margin:0;color:#29332c;background:#fff;font:14px/1.8 -apple-system,BlinkMacSystemFont,sans-serif}header{height:84px;border-top:5px solid #34784b;border-bottom:1px solid #e2e8e1;padding:20px 54px;display:flex;align-items:center;justify-content:space-between}header strong{font-size:23px;letter-spacing:-.6px}header span{font-size:11px;color:#778278}.layout{display:grid;grid-template-columns:190px 1fr;max-width:1170px;margin:38px auto;gap:44px}aside{border-right:1px solid #e2e8e1;padding-right:24px;color:#69776d;font-size:12px}aside h2{font-size:12px;color:#34784b;margin:0 0 20px}aside p{margin-bottom:19px}h1{font-size:26px;margin:0 0 22px;letter-spacing:-.8px}ul{list-style:none;margin:0;padding:0}li{padding:20px 0 27px;border-bottom:1px solid #e2e8e1}li p{max-width:650px;margin:0 0 20px}footer{text-align:right;font-size:12px;color:#69776d}.entry-author{display:block;color:#34784b;text-decoration:none}small{display:block;font-size:10px;color:#879088}.demo{font-size:11px;color:#69776d;margin-bottom:10px}</style><header><strong>EkşiBellek</strong><span>Temsili başlık içeriği · Gerçek eklenti görünümü</span></header><div class="layout"><aside><h2>örnek başlıklar</h2><p>okurken hatırlamak</p><p>kişisel not tutmak</p><p>kitap önerileri</p><p>şehirde yürümek</p></aside><main><div class="demo">Yazarlar ve metinler yalnızca tanıtım için hazırlanmıştır.</div><h1 id="title">okurken hatırlamak</h1><ul id="entry-item-list"><li data-author="örnek okur" data-author-id="900002" data-id="999000001"><p>Bazı yazıları okurken daha sonra dönmek istediğim bir ayrıntıyı not ediyorum. Aynı yazarla başka bir başlıkta karşılaşınca önceki gözlemimi yeniden görmek işe yarıyor.</p><footer><a class="entry-author" href="/biri/ornek-okur">örnek okur</a><small>02.11.2026 12:30</small></footer></li><li data-author="örnek gezgin" data-author-id="900001" data-id="999000002"><p>Okuma listem, birkaç etiket ve kısa hatırlatmalarla daha kolay takip ediliyor. Notun ne zaman alındığını görmek de bağlamı hatırlatıyor.</p><footer><a class="entry-author" href="/biri/ornek-gezgin">örnek gezgin</a><small>02.11.2026 12:45</small></footer></li><li data-author="örnek meraklı" data-author-id="900003" data-id="999000003"><p>Kendi notlarımı saklayabilmek ve gerektiğinde yedeğini alabilmek okumayı benim için daha düzenli hale getiriyor.</p><footer><a class="entry-author" href="/biri/ornek-merakli">örnek meraklı</a><small>02.11.2026 13:00</small></footer></li></ul></main></div></html>`;
 await context.route('https://eksisozluk.com/**',route=>route.fulfill({contentType:'text/html',body:fixture}));
 const site=await context.newPage();await site.goto('https://eksisozluk.com/eksibellek-ornek-baslik--999000001');
 const badge=site.getByRole('button',{name:'örnek okur için 1 notu göster',exact:true});await badge.waitFor();await badge.click();
 const frame=site.frameLocator('iframe[title="örnek okur için özel yazar notları"]');await frame.getByRole('heading',{name:'örnek okur',exact:true}).waitFor();await frame.getByText('Kitap önerilerini karşılaştırmak için bu yazarı hatırla.',{exact:true}).waitFor();
 await site.screenshot({path:join(output,'screenshot-note.png')});
 const icon=(await readFile(join(extension,'icons/128.png'))).toString('base64');const promo=await context.newPage();await promo.setViewportSize({width:440,height:280});
 await promo.setContent(`<!doctype html><html lang="tr"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;width:440px;height:280px;background:#f5f7f4;color:#253329;font-family:-apple-system,BlinkMacSystemFont,sans-serif;border-left:8px solid #35764a;padding:31px 30px}header{display:flex;align-items:center;gap:11px}img{width:43px;height:43px}strong{font-size:29px;letter-spacing:-1px}h1{font-size:35px;line-height:1.15;letter-spacing:-1.5px;margin:27px 0 12px;font-weight:700}p{font-size:12px;color:#69776d;margin:0}footer{display:flex;gap:7px;margin-top:18px}span{font-size:10px;padding:4px 8px;border:1px solid #dce6da;border-radius:5px;color:#35764a;background:#edf4ed}</style><header><img src="data:image/png;base64,${icon}" alt=""><strong>EkşiBellek</strong></header><h1>Yazarları hatırla.</h1><p>Ekşi Sözlük için kişisel notların.</p><footer><span>Ücretsiz</span><span>Yerel kayıt</span><span>Açık kaynak</span></footer></html>`);
 await promo.screenshot({path:join(output,'promo-small.png')});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({screenshots:3,screenshotSize:'1280x800',promoSize:'440x280',fictionalData:true,runtimeErrors:errors,output},null,2));
}finally{await context?.close();await rm(profile,{recursive:true,force:true});}
