import { username, resolveAuthor, noteStatus, backup, MAX_IMPORT_BYTES } from '../lib/model.js';

const params = new URLSearchParams(location.search);
const panel = params.has('panel');
const popup = document.documentElement.classList.contains('popup-document') || params.has('popup');
document.documentElement.classList.toggle('popup-document', popup);
document.body.className = panel ? 'panel' : popup ? 'popup' : '';
const root = document.querySelector('#app');
const appName = chrome.runtime.getManifest().name;
let state;
let view = panel ? 'author' : ['trash','support'].includes(params.get('view')) ? params.get('view') : popup ? 'add' : 'library';
let selected = null;
let query = '', tagFilter = '', scope = view==='trash'?'trash':'active', sort = 'recent';
let editing = false, working = false, refreshPending = false;
let draft = {};
let pageAuthors = [];
let preview = null;
let toastTimer;
let sizeFrame = 0, lastFrameHeight = 0;
const SUPPORT_ADDRESS = 'TFkvdWvfMF7sPuLaC7ejkdyCmzWiJJ4Aeq';
function reportFrameSize() {
  if(!panel)return;
  cancelAnimationFrame(sizeFrame);
  sizeFrame=requestAnimationFrame(()=>{
    const main=root.querySelector('main');
    const header=root.querySelector('.compact-header');
    if(!main||!header)return;
    const height=Math.ceil(header.getBoundingClientRect().height+main.scrollHeight+2);
    if(height!==lastFrameHeight){lastFrameHeight=height;parent.postMessage({type:'eksi-defter-size',height},'*');}
  });
}
const paths = { trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7', book: 'M4 3h13a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V3Zm0 13h15M8 7h7M8 10h5', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m7-7a4 4 0 0 1 0 8m6 9v-2a4 4 0 0 0-3-3.87', plus: 'M12 5v14M5 12h14', search: 'm21 21-4.4-4.4M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16', backup: 'M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5', settings: 'M4 7h16M4 17h16M8 4v6m8 4v6', expand: 'M14 3h7v7m0-7-8 8M10 21H3v-7m0 7 8-8', close: 'm6 6 12 12M6 18 18 6', arrow: 'm9 5 7 7-7 7' };
function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.7'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
  const extra = { copy: 'M9 9h12v12H9zM5 15H3V3h12v2', heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z' };
  const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', extra[name] || paths[name] || paths.book); svg.append(path); return svg;
}
function el(tag, cls = '', ...children) {
  const node = document.createElement(tag); if (cls) node.className = cls;
  for (const child of children.flat()) if (child != null) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
function button(text, fn, cls = 'secondary', symbol = '') {
  const b = el('button', `btn ${cls}`, symbol ? icon(symbol) : null, text); b.type = 'button'; b.addEventListener('click', fn); return b;
}
function link(text, href, cls = '') {
  const a = el('a', cls, text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
}
const formatDate = v => v ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : 'Henüz dışa aktarılmadı';
function toast(text) {
  const t = document.querySelector('#toast'); t.textContent = text; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
}
async function rpc(op, extra = {}) {
  const response = await chrome.runtime.sendMessage({ channel: 'eksi-defter', op, ...extra });
  if (!response?.ok) throw new Error(response?.error || 'Eklentiye ulaşılamadı. Sayfayı yenileyip tekrar dene.');
  return response.value;
}
async function load() { state = await rpc('get'); document.documentElement.dataset.theme = state.settings.theme; }
function panelRef() { return { username: params.get('panel'), authorId: params.get('authorId') || null }; }
function sourceRef() { return { sourceUrl: params.get('source') || '', sourceTitle: params.get('title') || '' }; }
function getSelected() { return state.authors.find(a => a.key === selected); }
function navigate(next, author = null) {
  if (editing && !confirm('Kaydedilmemiş değişiklikler var. Bu ekrandan ayrılmak istiyor musun?')) return;
  if(next==='trash'){scope='trash';query='';tagFilter='';selected=null;}else if(next==='library'&&scope==='trash'){scope='active';query='';tagFilter='';selected=null;}
  editing = false; view = next; if (author) selected = author.key; render();
}
async function commit(op, payload) {
  working = true;
  try { await rpc(op, { payload }); await load(); editing = false; refreshPending = false; }
  finally { working = false; }
}
function openLibrary() { chrome.tabs.create({ url: chrome.runtime.getURL('pages/app.html') }); }
function requestPanelClose() {
  if (editing && !confirm('Kaydedilmemiş değişiklikler var. Not kutusu kapatılsın mı?')) return;
  parent.postMessage({ type: 'eksi-defter-close' }, '*');
}
function brand() {
  const img = el('img'); img.src = '../icons/48.png'; img.alt = '';
  return el('div', 'brand', img, el('div', '', appName, el('small', '', 'yazarları hatırla.')));
}
function head(title, description = '', action = null) {
  return el('div', 'page-head', el('div', '', el('h1', '', title), description ? el('p', '', description) : null), action);
}
function render() {
  document.body.dataset.view=view;
  root.replaceChildren();
  const main = el('main', 'main');
  if (panel || popup) {
    const actions = el('div', 'actions', button('', openLibrary, 'ghost icon-btn', 'expand'));
    actions.firstChild.title = `${appName}’i geniş ekranda aç`; actions.firstChild.setAttribute('aria-label', actions.firstChild.title);
    if (panel) actions.append(button('', requestPanelClose, 'ghost icon-btn', 'close'));
    if (panel) { actions.lastChild.title = 'Kapat'; actions.lastChild.setAttribute('aria-label', 'Kapat'); }
    root.append(el('header', 'compact-header', brand(), actions));
    if (popup) {
      const nav = el('nav', 'compact-nav'); nav.setAttribute('aria-label', `${appName} menüsü`);
      for (const [key, label] of [['add','Not ekle'],['library','Yazarlar'],['backup','Yedekleme'],['settings','Ayarlar']]) nav.append(button(label, () => navigate(key), view === key || (key==='library' && ['author','trash'].includes(view)) || (key==='settings' && view==='support') ? 'active' : ''));
      root.append(nav);
    }
    root.append(main);
  } else {
    const nav = el('nav', 'nav'); nav.setAttribute('aria-label', `${appName} menüsü`);
    for (const [key, label, symbol] of [['library','Kayıtlı yazarlar','users'],['add','Not ekle','plus'],['trash','Çöp kutusu','trash'],['backup','Yedekleme','backup'],['settings','Ayarlar','settings']]) nav.append(button(label, () => navigate(key), view === key || (key==='settings' && view==='support') ? 'active' : '', symbol));
    const aside = el('aside', 'sidebar', brand(), nav, el('div', 'side-bottom', button('Destek ol',()=>navigate('support'),'ghost support-link','heart'), el('div', 'local', 'Yalnızca bu cihazda'), el('p', 'hint', 'Notların sana ait.\nEkşi Sözlük ile bağlantılı değildir.')));
    root.append(el('div', 'shell', aside, main));
  }
  if (refreshPending) main.append(el('div', 'notice warning', 'Başka bir pencerede değişiklik yapıldı. Kaydetmeden önce not sürümünü kontrol edeceğiz.'));
  if (view === 'library' || view === 'trash') renderLibrary(main,view==='trash');
  else if (view === 'add') {
    main.append(head('Yeni bir not', 'Bir rumuz, bir hatırlatma.'));
    main.append(noteForm({ username: draft.username || '', ...draft }, null, false));
  } else if (view === 'author') {
    if(popup)main.append(button(scope==='trash'?'Çöp kutusuna dön':'Yazarlara dön',()=>navigate(scope==='trash'?'trash':'library'),'ghost back-link'));
    const ref = panel ? panelRef() : getSelected();
    const author = ref ? resolveAuthor(state, ref.username, ref.authorId) : null;
    if (author) { selected = author.key; main.append(authorDetail(author)); }
    else { main.append(head(ref?.username || 'Yazar', 'Bu yazar için ilk notunu ekle.')); main.append(noteForm({ ...ref, ...sourceRef() }, null, true)); }
  } else if (view === 'backup') renderBackup(main);
  else if (view === 'settings') renderSettings(main);
  else if (view === 'support') renderSupport(main);
  reportFrameSize();
}
function trashCount() { return state.authors.reduce((sum, a) => sum + a.notes.filter(n => noteStatus(n) === 'trash').length, 0); }
function inScope(note) { return noteStatus(note) === scope; }
function openTrash() {
  if (panel) chrome.tabs.create({url: chrome.runtime.getURL('pages/app.html?view=trash')});
  else navigate('trash');
}
function renderLibrary(main, trash = false) {
  const count = trashCount();
  const availableAuthors = state.authors.filter(a => a.notes.some(n => !n.trashedAt));
  const activeCount = state.authors.reduce((sum, a) => sum + a.notes.filter(n => noteStatus(n) === 'active').length, 0);
  if (trash) {
    if (popup) main.append(button('Yazarlara dön', () => navigate('library'), 'ghost back-link'));
    const emptyButton = button('Çöp kutusunu boşalt', async () => {
      const revision = state.revision;
      const total = trashCount();
      if (!total || !confirm(`Çöp kutusundaki ${total} not ve düzenleme geçmişleri kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`)) return;
      try { await commit('emptyTrash', {expectedRevision: revision}); selected = null; render(); toast('Çöp kutusu boşaltıldı.'); }
      catch (e) { toast(e.message); }
    }, 'secondary danger', 'trash');
    emptyButton.disabled = count === 0;
    main.append(head('Çöp kutusu', `${count} not · ${state.authors.filter(a => a.notes.some(n => n.trashedAt)).length} yazar`, emptyButton));
    main.append(el('div', 'notice', 'Notlar otomatik silinmez. Geri getirebilir veya onay vererek kalıcı olarak silebilirsin.'));
  } else {
    main.append(head('Kayıtlı yazarlar', `${availableAuthors.length} yazar · ${activeCount} aktif not`, button('Not ekle', () => navigate('add'), '', 'plus')));
  }
  const search = el('input'); search.type = 'search'; search.placeholder = 'Yazar, not veya etiket ara…'; search.setAttribute('aria-label', 'Yazar, not veya etiket ara'); search.value = query;
  const tagSelect = el('select'); tagSelect.setAttribute('aria-label', 'Etikete göre filtrele');
  for (const tag of ['', ...new Set(state.authors.flatMap(a => a.tags))].sort((a,b) => a.localeCompare(b,'tr'))) { const o = el('option', '', tag || 'Tüm etiketler'); o.value = tag; tagSelect.append(o); } tagSelect.value = tagFilter;
  const mode = el('select'); mode.setAttribute('aria-label', 'Not durumu');
  for (const [v,t] of [['active','Aktif notlar'],['archived','Arşiv'],['trash','Çöp kutusu']]) { const o = el('option','',t); o.value = v; mode.append(o); } mode.value = scope;
  const sorting = el('select'); sorting.setAttribute('aria-label','Sıralama');
  for (const [v,t] of [['recent','Son güncellenen'],['name','Ada göre']]) { const o=el('option','',t);o.value=v;sorting.append(o); } sorting.value=sort;
  main.append(el('div', 'toolbar', el('div','search',icon('search'),search), tagSelect, mode, sorting));
  if (!trash) main.append(el('div', 'library-utility', button(`Çöp kutusu${count ? ` (${count})` : ''}`, openTrash, 'ghost', 'trash')));
  const results = el('div'); main.append(results);
  function draw() {
    const needle = query.toLocaleLowerCase('tr-TR');
    const authors = state.authors.filter(a => a.notes.some(inScope) && (!tagFilter || a.tags.includes(tagFilter)) && [a.username, ...a.aliases, ...a.tags, ...a.notes.filter(inScope).map(n => n.text)].join(' ').toLocaleLowerCase('tr-TR').includes(needle)).sort((a,b) => sort === 'name' ? a.username.localeCompare(b.username,'tr') : Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    results.replaceChildren();
    if (!authors.length) {
      if (trash && !count) results.append(empty('Çöp kutusu boş', 'Sildiğin notları bu ekrandan geri getirebilirsin.', 'Yazarlara dön', () => navigate('library')));
      else if (!trash && !availableAuthors.length && count) results.append(empty('Aktif kaydın yok', 'Sildiğin notlar çöp kutusunda saklanıyor.', 'Çöp kutusunu aç', openTrash));
      else if (!state.authors.length) results.append(empty('İlk yazarını hatırla', 'Okurken aklında kalanları bir notla sakla. Bir başka başlıkta yeniden karşılaştığında burada olacak.'));
      else results.append(empty('Aradığın kayıt bulunamadı', 'Aramayı, etiketleri veya not durumu filtresini değiştirebilirsin.', 'Filtreleri temizle', () => { query='';tagFilter='';if(!trash)scope='active';render(); }));
      return;
    }
    const list = el('div','author-list');
    const chosen = popup ? null : (authors.find(a=>a.key===selected) || authors[0]);
    if (chosen) selected=chosen.key;
    for (const author of authors) {
      const notes = author.notes.filter(inScope);
      const row = el('button',`author-row color-${author.color}${chosen?.key===author.key ? ' selected' : ''}`,el('span','avatar',author.username[0].toLocaleUpperCase('tr-TR')),el('span','author-copy',el('span','author-name',author.username,el('span','count',`${notes.length} not`)),el('span','preview',notes[0]?.text),tagList(author.tags)));
      row.type='button';row.setAttribute('aria-label',`${author.username} — ${notes.length} not`);
      row.addEventListener('click',()=>{selected=author.key;if(popup){view='author';render();}else draw();});list.append(row);
    }
    const layout=el('div','library-layout',list);if(chosen)layout.append(authorDetail(chosen));results.append(layout);
  }
  search.addEventListener('input',()=>{query=search.value;draw();});
  tagSelect.addEventListener('change',()=>{tagFilter=tagSelect.value;draw();});
  mode.addEventListener('change',()=>{scope=mode.value;if(scope==='trash'&&!trash)navigate('trash');else if(scope!=='trash'&&trash){view='library';render();}else draw();});
  sorting.addEventListener('change',()=>{sort=sorting.value;draw();});draw();
}
function tagList(values) { return el('span','tags',values.map(t=>el('span','tag',t))); }
function empty(title, text, action = 'İlk notunu ekle', fn = () => navigate('add')) { return el('div','empty',icon('book'),el('h2','',title),el('p','',text),button(action,fn,'')); }
async function changeNote(author, note, operation) {
  if (operation === 'purge' && !confirm('Bu not ve düzenleme geçmişi kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?')) return;
  try {
    await commit(operation, {username:author.username,authorId:author.authorId,noteId:note.id,expectedVersion:note.version});
    if (scope==='trash' && !getSelected()?.notes.some(n=>n.trashedAt)) { selected=null;if(view==='author')view='trash'; }
    render();
    const messages={trash:'Not çöp kutusuna taşındı. Geri getirebilirsin.',untrash:note.archivedAt?'Not arşive geri getirildi.':'Not geri getirildi.',purge:'Not kalıcı olarak silindi.',archive:'Not arşivlendi. Arşiv filtresinden geri getirebilirsin.',restore:'Not geri getirildi.'};
    toast(messages[operation]);
  } catch(e) { toast(e.message); }
}
async function changeAuthor(author, operation) {
  const notes=author.notes.filter(n=>operation==='trashAuthor'?!n.trashedAt:Boolean(n.trashedAt));
  if (operation==='trashAuthor' && !confirm(`${author.username} için ${notes.length} not (arşivdekiler dahil) çöp kutusuna taşınacak. Notları geri getirebilirsin. Devam edilsin mi?`)) return;
  try {
    await commit(operation,{username:author.username,authorId:author.authorId,expectedNotes:notes.map(n=>({id:n.id,version:n.version}))});
    if(!panel){view=operation==='trashAuthor'?'library':'trash';scope=operation==='trashAuthor'?'active':'trash';selected=null;}
    render();toast(operation==='trashAuthor'?`${notes.length} not çöp kutusuna taşındı.`:`${notes.length} not önceki konumuna geri getirildi.`);
  } catch(e) { toast(e.message); }
}
function authorDetail(author) {
  const trash = scope==='trash';
  const detail=el('section',`detail color-${author.color}`);
  const add=trash?null:button('Not ekle',()=>{detail.replaceChildren(head(author.username,'Yeni gözlemini ekle.'),noteForm({...author,...(panel?sourceRef():{})},null,true));},'secondary','plus');
  detail.append(el('div','detail-head',el('div','',el('h2','',author.username),link('Ekşi profilini aç ↗',`https://eksisozluk.com/biri/${encodeURIComponent(author.username)}`),tagList(author.tags)),add));
  const notes=author.notes.filter(inScope).sort((a,b)=>Date.parse(trash?b.trashedAt:b.createdAt)-Date.parse(trash?a.trashedAt:a.createdAt));
  if(!notes.length){detail.append(el('p','hint','Bu görünümde not yok. Arşiv ve çöp kutusunu kontrol edebilirsin.'));if(!trash&&author.notes.some(n=>n.trashedAt))detail.append(button('Çöp kutusunu aç',openTrash,'ghost','trash'));}
  for(const note of notes){
    const card=el('article','note');
    card.append(el('div','note-meta',el('span','',trash?`Silindi: ${formatDate(note.trashedAt)}`:formatDate(note.createdAt)),el('span','',trash?(note.archivedAt?'Arşivdeydi':''):(note.history.length?'Düzenlendi':''))),el('p','note-text',note.text));
    if(note.sourceUrl)card.append(link(note.sourceTitle||'Kaynak entry’yi aç ↗',note.sourceUrl,'note-source'));
    const actions=el('div','note-actions');
    if(trash){
      actions.append(button('Geri getir',()=>changeNote(author,note,'untrash'),'ghost'),button('Kalıcı sil',()=>changeNote(author,note,'purge'),'ghost danger'));
    } else {
      actions.append(button('Düzenle',()=>card.replaceChildren(noteForm({...author,...note},note,true)),'ghost'),button(note.archivedAt?'Arşivden çıkar':'Arşivle',()=>changeNote(author,note,note.archivedAt?'restore':'archive'),'ghost'),button('Sil',()=>changeNote(author,note,'trash'),'ghost danger'));
    }
    card.append(actions);
    if(note.history.length){
      const history=el('details','history',el('summary','',`Düzenleme geçmişi (${note.history.length})`));
      for(const old of note.history){history.append(el('div','revision',el('span','hint',formatDate(old.savedAt)),el('p','',old.text),old.sourceUrl?link(old.sourceTitle||'Eski kaynak',old.sourceUrl,'note-source'):null,trash?null:button('Bu sürümü geri getir',async()=>{try{await commit('edit',{username:author.username,authorId:author.authorId,noteId:note.id,expectedVersion:note.version,text:old.text,sourceUrl:old.sourceUrl,sourceTitle:old.sourceTitle});render();toast('Önceki sürüm geri getirildi.');}catch(e){toast(e.message);}},'ghost')));}
      card.append(history);
    }
    detail.append(card);
  }
  if(trash){if(notes.length)detail.append(el('div','author-danger-zone',button('Bu yazarın tüm notlarını geri getir',()=>changeAuthor(author,'untrashAuthor'),'secondary')));}
  else {
    const profile=el('details','disclosure profile-options',el('summary','','Etiketleri ve rengi düzenle'));
    const tagsInput=el('input');tagsInput.value=author.tags.join(', ');tagsInput.setAttribute('aria-label','Yazar etiketleri');
    const color=colorSelect(author.color);const error=el('p','error');
    profile.append(el('div','form-row',field('Etiketler',tagsInput),field('İşaret rengi',color)),button('Kaydet',async()=>{try{await commit('profile',{...author,tags:tagsInput.value,color:color.value});render();toast('Yazar bilgileri güncellendi.');}catch(e){error.textContent=e.message;}}),error);detail.append(profile);
    if(author.notes.some(n=>!n.trashedAt))detail.append(el('div','author-danger-zone',button('Yazarın tüm notlarını sil',()=>changeAuthor(author,'trashAuthor'),'ghost danger','trash')));
  }
  return detail;
}
function field(title, input, hint='') { if(!input.hasAttribute('aria-label'))input.setAttribute('aria-label',title);return el('label','field',el('span','field-title',title),input,hint?el('span','hint',hint):null); }
function colorSelect(value='green') { const select=el('select');for(const [v,t]of [['green','Yeşil'],['blue','Mavi'],['amber','Kehribar'],['rose','Gül'],['slate','Gri']]){const o=el('option','',t);o.value=v;select.append(o);}select.value=value;return select; }
function noteForm(data, existing=null, fixed=false) {
  const form=el('form','form-surface');
  const name=el('input');name.required=true;name.maxLength=80;name.placeholder='ör. sergezer';name.value=data.username||'';name.readOnly=fixed;name.autocomplete='off';name.name='username';
  if(!fixed&&pageAuthors.length){const suggestions=el('datalist');suggestions.id='page-authors';for(const ref of pageAuthors){const option=el('option');option.value=ref.username;suggestions.append(option);}name.setAttribute('list','page-authors');form.append(suggestions);}
  const text=el('textarea');text.required=true;text.maxLength=20000;text.placeholder='Bu yazar hakkında neyi hatırlamak istersin?';text.value=data.text||'';text.name='note';
  const labels=el('input');labels.placeholder='troll, fake';labels.value=Array.isArray(data.tags)?data.tags.join(', '):data.tags||'';
  const color=colorSelect(data.color);
  const source=el('input');source.type='url';source.placeholder='https://eksisozluk.com/entry/…';source.value=data.sourceUrl||'';
  const title=el('input');title.maxLength=300;title.placeholder='İsteğe bağlı';title.value=data.sourceTitle||'';
  const counter=el('div','counter',`${text.value.length} / 20.000`);text.addEventListener('input',()=>counter.textContent=`${text.value.length} / 20.000`);
  const noteField=field('Notun',text);noteField.classList.add('note-field');noteField.append(counter);
  form.append(field('Kullanıcı adı',name),noteField);
  const options=el('div','form-options');
  const extras=el('details','disclosure',el('summary','',existing?'Kaynak seçenekleri':'Etiket, renk ve kaynak'));
  if(!existing)extras.append(el('div','form-row',field('Etiketler',labels,'Virgülle ayırabilirsin.'),field('İşaret rengi',color)));
  extras.append(field('Entry veya başlık bağlantısı',source),field('Kaynak başlığı',title));options.append(extras);form.append(options);
  const save=el('button','btn',existing?'Değişiklikleri kaydet':'Notu kaydet');save.type='submit';
  const error=el('p','error');error.setAttribute('role','alert');
  form.append(el('div','form-actions',save,(fixed||existing)?button('Vazgeç',()=>{editing=false;render();},'secondary'):null),error,el('p','hint form-hint','Notların bu tarayıcıda saklanır.'));
  form.addEventListener('input',()=>{
    editing=true;
    if(!fixed&&!existing){draft={username:name.value,text:text.value,tags:labels.value,color:color.value,sourceUrl:source.value,sourceTitle:title.value};chrome.storage.local.set({'eksi-defter-draft':draft}).catch(()=>{});}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(save.disabled)return;save.disabled=true;error.textContent='';
    try{
      const observed=pageAuthors.find(a=>username(a.username)===username(name.value));
      const identity=data.authorId||observed?.authorId||null;
      const payload={username:name.value,authorId:identity,text:text.value,tags:labels.value,color:color.value,sourceUrl:source.value,sourceTitle:title.value};
      if(existing)Object.assign(payload,{noteId:existing.id,expectedVersion:existing.version});
      await commit(existing?'edit':'add',payload);
      const author=resolveAuthor(state,username(name.value),identity);selected=author.key;
      if(!fixed&&!existing){draft={};await chrome.storage.local.remove('eksi-defter-draft');}
      view=panel?'author':'library';scope='active';query='';tagFilter='';render();toast(existing?'Not güncellendi.':'Not defterine eklendi.');
    }catch(e){error.textContent=e.message;save.disabled=false;}
  });
  return form;
}
function renderBackup(main) {
  main.append(head('Yedekleme','Defterinin bir kopyası her zaman yanında olsun.'));
  if(state.settings.reminders&&state.revision>state.lastExportRevision)main.append(el('div','notice warning','Son dışa aktarmadan sonra değişiklikler var. Güncel bir JSON kopyası alabilirsin.'));
  const exportDate=el('div','backup-date',`Son dışa aktarma: ${formatDate(state.lastExportAt)}`);
  const exportSection=el('section','section',el('h2','','Defterini dışa aktar'),el('p','','Tüm yazarlar, notlar, arşiv, çöp kutusu ve düzenleme geçmişi tek bir JSON dosyasına kaydedilir.'),exportDate);
  exportSection.append(button('JSON dosyasını indir',async()=>{
    working=true;
    try{
      await load();const revision=state.revision;
      const blob=new Blob([JSON.stringify(backup(state),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download=`eksibellek-yedek-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      await rpc('exported',{payload:{revision}});await load();
      exportDate.textContent=`Son dışa aktarma: ${formatDate(state.lastExportAt)}`;
      if(state.revision<=state.lastExportRevision)main.querySelector('.notice.warning')?.remove();
      toast('Dışa aktarma başlatıldı. Dosyanın indirildiğini kontrol et.');
    }catch(e){toast(e.message);}finally{working=false;}
  },'','backup'));main.append(exportSection);
  const input=el('input');input.type='file';input.accept='.json,application/json';input.setAttribute('aria-label','JSON yedeği seç');
  const result=el('div');const error=el('p','error');error.setAttribute('role','alert');
  const section=el('section','section',el('h2','','Yedekten içe aktar'),el('p','','Önce dosyayı kontrol ederiz. Mevcut notların korunur; aynı dosyayı tekrar yüklemek kopya oluşturmaz.'),input,result,error);main.append(section);
  const previewImport=async()=>{
    preview=null;result.replaceChildren();error.textContent='';const file=input.files[0];if(!file)return;
    try{
      if(file.size>MAX_IMPORT_BYTES)throw new Error('Yedek en fazla 20 MB olabilir.');
      const raw=JSON.parse(await file.text());const report=await rpc('previewImport',{backup:raw,mode:'preserve'});preview={raw,report};
      result.append(el('div','import-summary',`${report.newAuthors} yeni yazar · ${report.newNotes} eklenecek not · ${report.duplicates} aynı not · ${report.conflicts.length} çakışma`));
      if(report.metadataConflicts)result.append(el('p','hint','Etiketler birleştirilir; mevcut yazar rengi korunur.'));
      for(const conflict of report.conflicts.slice(0,20))result.append(el('div','conflict',el('strong','',conflict.username),el('p','',`Mevcut (${({active:'Aktif',archived:'Arşiv',trash:'Çöp kutusu'})[conflict.currentStatus]||'Aktif'}): ${conflict.current}`),el('p','',`Dosyadaki (${({active:'Aktif',archived:'Arşiv',trash:'Çöp kutusu'})[conflict.incomingStatus]||'Aktif'}): ${conflict.incoming}`)));
      if(report.conflicts.length>20)result.append(el('p','hint',`İlk 20 çakışma gösteriliyor; seçim ${report.conflicts.length} çakışmanın tümüne uygulanacak.`));
      const mode=el('select');mode.setAttribute('aria-label','Çakışan notlar için seçim');for(const[v,t]of[['preserve','İki sürümü de ayrı not olarak koru'],['skip','Çakışmalarda mevcut notu koru']]){const o=el('option','',t);o.value=v;mode.append(o);}result.append(field('Çakışan notlar',mode));
      const apply=button('Kontrol ettim, içe aktar',async()=>{if(!preview)return;apply.disabled=true;working=true;try{const r=await rpc('import',{backup:preview.raw,mode:mode.value,expectedRevision:preview.report.revision});await load();preview=null;render();toast(`${r.newAuthors} yazar ve ${r.newNotes} not eklendi.`);}catch(e){error.textContent=e.message;apply.disabled=false;}finally{working=false;}},'');result.append(apply);
    }catch(e){error.textContent=e instanceof SyntaxError?'Dosya okunamadı. Geçerli bir JSON yedeği seç.':e.message;}
  };input.addEventListener('change',previewImport);
  main.append(el('p','hint','JSON yedeği notlarını açık metin olarak içerir. Eklentiyi kaldırmak, bu Chrome profilindeki kayıtları siler.'));
}
function renderSettings(main) {
  main.append(head('Ayarlar','Defterini kendine göre düzenle.'));
  const theme=el('select');for(const[v,t]of[['system','Sistemle aynı'],['light','Açık'],['dark','Koyu']]){const o=el('option','',t);o.value=v;theme.append(o);}theme.value=state.settings.theme;
  const reminders=el('input');reminders.type='checkbox';reminders.checked=state.settings.reminders;
  const error=el('p','error');
  main.append(el('section','section',el('h2','','Görünüm ve hatırlatmalar'),field('Tema',theme),el('label','check-label',reminders,'Yedekleme ekranında dışa aktarılmamış değişiklikleri hatırlat'),el('div','actions',button('Ayarları kaydet',async()=>{try{await commit('settings',{theme:theme.value,reminders:reminders.checked});render();toast('Ayarlar kaydedildi.');}catch(e){error.textContent=e.message;}},'')),error));
  main.append(el('section','section support-teaser',el('h2','','EkşiBellek’e destek ol'),el('p','','EkşiBellek ücretsizdir. İstersen geliştirilmesine gönüllü destek gönderebilirsin.'),button('Destek seçenekleri',()=>navigate('support'),'secondary','heart')));
  main.append(el('section','section',el('h2','','Sana özel, cihazında'),el('p','','Notlar, rumuzlar, etiketler, kaynak bağlantıları ve taslağın bu Chrome profilindeki eklenti alanında saklanır. Hesap veya sunucu kullanılmaz. Notların geliştiriciye gönderilmez.'),el('p','','Sayfa üzerindeki not kutuları eklentinin kendi çerçevesinde açılır. Dış bağlantıları yalnızca sen tıklayınca açarız.'),el('div','actions',link('Kaynak kodu','https://github.com/togiwan/eksibellek','btn secondary'),link('Gizlilik','https://togiwan.github.io/eksibellek/privacy.html','btn secondary'),link('Sorun bildir','https://github.com/togiwan/eksibellek/issues','btn secondary')),el('p','hint',`${appName} ${chrome.runtime.getManifest().version} · Açık kaynak · MIT lisansı.\nEkşi Sözlük’ün resmî ürünü değildir.`)));
}
function renderSupport(main) {
  main.append(button('Ayarlara dön',()=>navigate('settings'),'ghost back-link support-back'));
  main.append(head('Destek ol','EkşiBellek herkes için ücretsiz.'));
  main.append(el('p','support-intro','İstersen geliştirilmesine kripto ile katkıda bulunabilirsin. Desteğin için teşekkürler.'));
  const wallets=el('div','support-wallets');
  for(const [symbol,name,network] of [['TRX','TRON','TRON'],['USDT','Tether USDt','TRON · TRC20']]){
    const card=el('section','wallet-card');card.setAttribute('aria-label',`${symbol} destek cüzdanı`);
    const copy=button('',async()=>{
      try{await navigator.clipboard.writeText(SUPPORT_ADDRESS);toast(`${symbol} adresi kopyalandı.`);}
      catch{toast('Adres kopyalanamadı. Adres metnini seçip elle kopyalayabilirsin.');}
    },'secondary wallet-copy','copy');
    copy.append(el('span','wallet-copy-label','Kopyala'));
    copy.setAttribute('aria-label',`${symbol} adresini kopyala`);
    copy.title=`${symbol} adresini kopyala`;
    card.append(el('div','wallet-header',el('div','wallet-identity',el('span','wallet-symbol',symbol),el('div','',el('h2','',symbol),el('span','hint',name))),el('span','wallet-network',network)),el('div','wallet-details',el('div','wallet-address',el('span','hint','Alıcı adresi'),el('code','',SUPPORT_ADDRESS)),copy));
    wallets.append(card);
  }
  main.append(wallets,el('p','hint support-network-note','İki seçenek de aynı TRON adresini kullanır. Gönderim ekranında TRON ağını seç.'));
}
function connect() {
  try {
    const port=chrome.runtime.connect({name:'defter-updates'});
    port.onMessage.addListener(async()=>{if(working)return;if(editing){refreshPending=true;return;}try{await load();render();}catch(e){toast(e.message);}});
    port.onDisconnect.addListener(()=>setTimeout(connect,1500));
  }catch{setTimeout(connect,2500);}
}
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel)requestPanelClose();});
if(panel){new ResizeObserver(reportFrameSize).observe(root);new MutationObserver(reportFrameSize).observe(root,{childList:true,subtree:true,characterData:true});document.addEventListener('toggle',reportFrameSize,true);document.addEventListener('input',reportFrameSize);}
window.addEventListener('message',event=>{if(panel&&event.source===parent&&['https://eksisozluk.com','https://www.eksisozluk.com'].includes(event.origin)&&event.data?.type==='eksi-defter-request-close')requestPanelClose();});
try {
  await load();
  if(popup){try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(tab?.id)pageAuthors=await chrome.tabs.sendMessage(tab.id,{channel:'eksi-defter',op:'pageAuthors'})||[];}catch{}}
  draft=(await chrome.storage.local.get('eksi-defter-draft'))['eksi-defter-draft']||{};render();connect();
}catch(e){root.replaceChildren(el('main','main',head(`${appName} açılamadı`),el('p','error',e.message),button('Yeniden dene',()=>location.reload())));}
