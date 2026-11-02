(() => {
  if (document.documentElement.dataset.eksiDefterLoaded) return;
  document.documentElement.dataset.eksiDefterLoaded = '1';
  const selector = '#entry-item-list li[data-author]';
  const colorMap = { green: ['#34784b','#edf5ed'], blue: ['#3e6999','#edf3fb'], amber: ['#946c2d','#fbf3e4'], rose: ['#a44f6a','#fbedf1'], slate: ['#66717d','#edf0f3'] };
  const buttons = new Map();
  let overlay = null, frame = null, anchor = null, pendingOpen = null;
  let preferredHeight = 400;
  let scheduled = false, refreshing = false, refreshAgain = false;
  const extensionOrigin = chrome.runtime.getURL('').replace(/\/$/, '');
  const escapeSVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h14v18l-7-4-7 4V3Z"/><path d="M9 8h6m-6 4h4"/></svg>';
  function references() {
    return Array.from(document.querySelectorAll(selector)).map(entry => ({ username: entry.dataset.author, authorId: entry.dataset.authorId || null, source: /^\d+$/.test(entry.dataset.id || '') ? `https://eksisozluk.com/entry/${entry.dataset.id}` : '', title: document.querySelector('#title')?.textContent.trim().slice(0,300) || '' }));
  }
  function place() {
    if (!overlay || !anchor?.isConnected) { if (overlay) requestClose(); return; }
    const group = anchor.getRootNode().host?.closest('eksi-defter-author');
    const rect = (group || anchor).getBoundingClientRect();
    const width = Math.min(420, innerWidth - 24);
    const height = Math.min(Math.max(200, preferredHeight), 580, innerHeight - 32);
    const below = innerHeight - rect.bottom;
    const top = below > 300 ? Math.min(rect.bottom + 9, innerHeight - height - 16) : Math.max(16, rect.top - height - 9);
    Object.assign(overlay.style, { width: `${width}px`, height: `${height}px`, left: `${Math.max(12, Math.min(rect.right-width, innerWidth-width-12))}px`, top: `${Math.max(16,top)}px` });
  }
  function close() {
    overlay?.remove(); overlay = null; frame = null;
    const previous = anchor; anchor = null;previous?.focus();
    if (pendingOpen) { const next = pendingOpen; pendingOpen = null; open(next.ref,next.button); }
  }
  function requestClose() {
    if (!frame) return;
    frame.contentWindow.postMessage({ type: 'eksi-defter-request-close' }, extensionOrigin);
  }
  function open(ref, button) {
    if (overlay) { pendingOpen = anchor === button ? null : {ref,button};requestClose();return; }
    anchor = button;
    preferredHeight = 400;
    overlay = document.createElement('eksi-defter-panel');
    Object.assign(overlay.style, { position:'fixed', zIndex:'2147483647', display:'block', borderRadius:'16px', overflow:'hidden', boxShadow:'0 8px 24px #162b2014, 0 24px 64px #162b202e', border:'1px solid #74887540', colorScheme:'light dark' });
    const shadow = overlay.attachShadow({mode:'open'});
    frame = document.createElement('iframe');
    frame.title = `${ref.username} için özel yazar notları`;
    frame.style.cssText = 'display:block;width:100%;height:100%;border:0;background:#fff;';
    const url = new URL(chrome.runtime.getURL('pages/app.html'));
    url.searchParams.set('panel',ref.username);
    if(ref.authorId)url.searchParams.set('authorId',ref.authorId);
    if(ref.source)url.searchParams.set('source',ref.source);
    if(ref.title)url.searchParams.set('title',ref.title);
    frame.src=url.href;shadow.append(frame);document.documentElement.append(overlay);place();
    frame.addEventListener('load',()=>frame.focus(),{once:true});
  }
  document.addEventListener('pointerdown',event=>{if(overlay&&!event.composedPath().includes(overlay)&&!event.composedPath().includes(anchor?.getRootNode().host))requestClose();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&overlay)requestClose();});
  window.addEventListener('message',event=>{
    if(!frame || event.source!==frame.contentWindow || event.origin!==extensionOrigin)return;
    if(event.data?.type==='eksi-defter-close')close();
    else if(event.data?.type==='eksi-defter-size' && Number.isFinite(event.data.height)){
      preferredHeight=Math.min(20000,Math.max(200,event.data.height));place();
    }
  });
  window.addEventListener('resize',place);window.addEventListener('scroll',place,{passive:true});
  function scan() {
    scheduled = false;
    for (const [host] of buttons) if(!host.isConnected)buttons.delete(host);
    for (const entry of document.querySelectorAll(selector)) {
      const authorLink=entry.querySelector('a.entry-author');
      if(!authorLink||authorLink.parentElement?.tagName==='EKSI-DEFTER-AUTHOR')continue;
      const ref={username:entry.dataset.author,authorId:entry.dataset.authorId||null,source:/^\d+$/.test(entry.dataset.id||'')?`https://eksisozluk.com/entry/${entry.dataset.id}`:'',title:document.querySelector('#title')?.textContent.trim().slice(0,300)||''};
      const host=document.createElement('eksi-defter-button');host.style.cssText='display:inline-flex!important;flex:0 0 auto!important;vertical-align:middle;margin:0!important;line-height:1;';
      const shadow=host.attachShadow({mode:'open'});const style=document.createElement('style');
      style.textContent=':host{color-scheme:light}button{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:3px;height:20px;min-width:20px;border:1px solid transparent;border-radius:6px;padding:2px 4px;background:transparent;color:#7d8b80;cursor:pointer;font:500 10px -apple-system,BlinkMacSystemFont,sans-serif;line-height:1;vertical-align:middle}svg{width:12px;height:12px;flex-shrink:0}button:hover{background:#edf5ed;color:#34784b;border-color:#c8dec9}button:focus-visible{outline:2px solid #34784b;outline-offset:2px}button.saved{background:var(--bg);color:var(--fg);border-color:color-mix(in srgb,var(--fg) 20%,transparent)}';
      const button=document.createElement('button');button.type='button';button.title=`${ref.username} için not ekle`;button.setAttribute('aria-label',button.title);button.innerHTML=escapeSVG;
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();open(ref,button);});shadow.append(style,button);
      const group=document.createElement('eksi-defter-author');
      // The site styles author links as blocks. A nonwrapping flex group keeps
      // the badge BEFORE the name, on its baseline, without moving the date.
      group.style.cssText='display:inline-flex!important;align-items:center!important;gap:5px!important;flex-wrap:nowrap!important;white-space:nowrap!important;vertical-align:middle!important;max-width:100%;';
      authorLink.before(group);group.append(host,authorLink);buttons.set(host,{button,ref});
    }
    refresh();
  }
  async function refresh() {
    if(refreshing){refreshAgain=true;return;}refreshing=true;
    try {
      const refs=Array.from(buttons.values(),v=>v.ref).slice(0,1000);
      const response=await chrome.runtime.sendMessage({channel:'eksi-defter',op:'lookup',authors:refs});
      if(!response?.ok)throw new Error(response?.error||'Notlara ulaşılamadı');
      for(const {button,ref}of buttons.values()){
        const summary=response.value.find(a=>a.username===ref.username&&a.authorId===ref.authorId);
        const count=summary?.count||0;button.classList.toggle('saved',count>0);
        const colors=colorMap[summary?.color]||colorMap.green;button.style.setProperty('--fg',colors[0]);button.style.setProperty('--bg',colors[1]);
        let number=button.querySelector('span');if(count){if(!number){number=document.createElement('span');button.append(number);}number.textContent=String(count);}else number?.remove();
        button.title=count?`${ref.username} için ${count} notu göster`:`${ref.username} için not ekle`;button.setAttribute('aria-label',button.title);
      }
    }catch{for(const {button}of buttons.values()){button.title='EkşiBellek’e ulaşılamadı. Eklentiyi güncellediysen sayfayı yenile.';}}
    finally{refreshing=false;if(refreshAgain){refreshAgain=false;refresh();}}
  }
  function schedule() { if(!scheduled){scheduled=true;setTimeout(scan,180);} }
  const observer=new MutationObserver(records=>{if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&!['EKSI-DEFTER-BUTTON','EKSI-DEFTER-PANEL','EKSI-DEFTER-AUTHOR'].includes(n.tagName))))schedule();});
  observer.observe(document.body,{childList:true,subtree:true});
  chrome.runtime.onMessage.addListener((message,sender,respond)=>{if(sender.id===chrome.runtime.id&&message?.channel==='eksi-defter'&&message.op==='pageAuthors')respond(references().slice(0,1000));});
  function connect(){try{const port=chrome.runtime.connect({name:'defter-updates'});port.onMessage.addListener(refresh);port.onDisconnect.addListener(()=>setTimeout(connect,1800));}catch{}}
  scan();connect();
})();
