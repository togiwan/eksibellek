// Optional integration runner: uses real Chromium storage in disposable profiles.
// It only SIGKILLs its own browser after verifying PID + exact profile path.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import {mkdtemp,rm,writeFile,readFile,cp,mkdir,realpath} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {emptyState,backup} from '../extension/lib/model.js';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import path from 'node:path';
const execFileAsync=promisify(execFile);
const base=await realpath(process.env.PERSISTENCE_TEMP_DIR || tmpdir());
const task=await mkdtemp(path.join(base,'eksibellek-persistence-'));
const source=fileURLToPath(new URL('../extension/',import.meta.url));
const profile=task+'/profile';const extension=task+'/installed-extension';
await cp(source,extension,{recursive:true});
const out=process.env.PERSISTENCE_OUTPUT_DIR || await mkdtemp(path.join(base,'eksibellek-evidence-'));
await mkdir(out,{recursive:true});
const key='eksi-defter-v1';const results=[];const details={crashes:[],inflight:[]};
let ctx,cdp,page,id,pid;let expected;let crashed=false;
const canonical=v=>JSON.stringify(normalize(v));
function normalize(v){return Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,normalize(v[k])])):v;}
const digest=v=>createHash('sha256').update(canonical(v)).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(fn,label,timeout=10000){const start=Date.now();while(Date.now()-start<timeout){if(await fn())return;await sleep(50);}throw new Error('Timed out: '+label);}
function record(name,extra={}){results.push({name,pass:true,...extra});console.log('PASS',name,JSON.stringify(extra));}
async function launch(profilePath=profile,extensionPath=extension){
 ctx=await chromium.launchPersistentContext(profilePath,{executablePath:process.env.CHROMIUM_EXECUTABLE || chromium.executablePath(),headless:true,args:[`--disable-extensions-except=${extensionPath}`,`--load-extension=${extensionPath}`],viewport:{width:1280,height:900}});
 const sw=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');id=new URL(sw.url()).host;cdp=await ctx.browser().newBrowserCDPSession();
 const processes=await cdp.send('SystemInfo.getProcessInfo');pid=processes.processInfo.find(p=>p.type==='browser').id;
 const command=(await execFileAsync('ps',['-p',String(pid),'-o','command='])).stdout;
 assert(command.includes('--user-data-dir='+profilePath)&&profilePath.startsWith(task+'/'),'Only the isolated test browser may be terminated');
 page=await ctx.newPage();await page.goto(`chrome-extension://${id}/pages/app.html`);await page.locator('main').waitFor({timeout:15000});crashed=false;
}
async function rpc(op,extra={},target=page){const r=await target.evaluate(msg=>chrome.runtime.sendMessage({channel:'eksi-defter',...msg}),{op,...extra});if(!r?.ok)throw new Error(r?.error||'No RPC reply');return r.value;}
async function current(){return rpc('get');}
async function same(label){const actual=await current();assert.equal(digest(actual),digest(expected),label);return actual;}
async function restart(){await ctx.close();await launch();}
function kill(){assert(Number.isInteger(pid)&&pid>0);process.kill(pid,'SIGKILL');crashed=true;}
async function afterKill(){await waitFor(async()=>{try{process.kill(pid,0);return false;}catch(e){return e.code==='ESRCH';}},'owned Chrome process exit');try{await ctx.close();}catch{}await launch();}
function fixture(){
 const state=emptyState();const t='2026-11-02T12:00:00.000Z';
 for(let i=0;i<150;i++){
  const notes=Array.from({length:4},(_,j)=>({id:`fixture-${i}-${j}`,text:`Yazar ${i}, not ${j}: Türkçe ığüşöç İ, emoji 📝\n`+'Kalıcı gözlem ve kaynak. '.repeat(j===2?90:4),sourceUrl:`https://eksisozluk.com/entry/${1000000+i*10+j}`,sourceTitle:`Kaynak başlığı ${i}`,createdAt:t,updatedAt:t,version:j===1?3:1,archivedAt:j===0?t:null,trashedAt:j===3&&i%3===0?t:null,history:j===1?[{text:'Önceki sürüm 2',sourceUrl:'',sourceTitle:'',savedAt:t},{text:'Önceki sürüm 1',sourceUrl:'',sourceTitle:'',savedAt:t}]:[]}));
  state.authors.push({key:`author-${i}`,username:`test yazar ${i}`,authorId:String(800000+i),aliases:[`eski rumuz ${i}`],tags:['troll','fake',`grup ${i%7}`],color:['green','blue','amber','rose','slate'][i%5],createdAt:t,updatedAt:t,notes});
 }
 return backup(state);
}
async function workerTarget(){return(await cdp.send('Target.getTargets')).targetInfos.find(t=>t.type==='service_worker'&&t.url===`chrome-extension://${id}/background.js`);}
try{
 await launch();assert.equal((await current()).authors.length,0);
 await rpc('import',{backup:fixture(),mode:'preserve',expectedRevision:0});await rpc('settings',{payload:{theme:'dark',reminders:false}});expected=await current();await rpc('exported',{payload:{revision:expected.revision}});expected=await current();
 assert.equal(expected.authors.length,150);assert.equal(expected.authors.flatMap(a=>a.notes).length,600);
 const initialHash=digest(expected);record('Fixture: 150 authors / 600 notes, 150 archived, 50 in trash, 300 history entries, aliases/tags/colors/settings/export metadata',{hash:initialHash,serializedBytes:Buffer.byteLength(canonical(expected))});
 for(let i=0;i<5;i++){await restart();await same('graceful restart '+i);}record('Five complete graceful browser shutdown/relaunch cycles preserve the entire state');
 for(let i=0;i<3;i++){
  const old=await workerTarget();assert(old);const dev=await ctx.newCDPSession(page);let version;const events=[];
  dev.on('ServiceWorker.workerVersionUpdated',event=>{for(const v of event.versions)if(v.scriptURL===old.url){events.push(v.runningStatus);if(v.runningStatus==='running')version=v.versionId;}});
  await dev.send('ServiceWorker.enable');await waitFor(()=>!!version,'extension service-worker version');
  const stopAt=events.length;await dev.send('ServiceWorker.stopWorker',{versionId:version});await waitFor(()=>events.slice(stopAt).includes('stopped'),'worker stopped event');
  await same('worker restart '+i);await waitFor(()=>events.slice(stopAt).includes('running'),'worker running event');await dev.detach();
 }
 record('Three actual service-worker terminations and revivals preserve the entire state');
 const page2=await ctx.newPage();await page2.goto(`chrome-extension://${id}/pages/app.html`);await page2.locator('main').waitFor();
 const writes=Array.from({length:60},(_,i)=>rpc('add',{payload:{username:'eş zamanlı yazar',authorId:'999901',text:`Eş zamanlı kayıt ${i}`}},i%2?page:page2));
 await Promise.all(writes);expected=await current();assert.equal(expected.authors.find(a=>a.username==='eş zamanlı yazar').notes.length,60);
 await restart();await same('concurrent persistence');record('Sixty concurrent writes from two extension pages survive a full restart without losing notes');
 for(let i=0;i<10;i++){
  const response=await rpc('add',{payload:{username:'ani kapanma testi',authorId:'999902',text:`Onaylanan kayıt ${i}`}});
  const ack=performance.now();kill();const lag=performance.now()-ack;expected=response;
  await afterKill();await same('acknowledged crash '+i);details.crashes.push({cycle:i+1,ackToKillMs:lag,hash:digest(expected)});
 }
 record('Ten SIGKILL browser crashes immediately after acknowledged saves preserve the entire state',{maxAckToKillMs:Math.max(...details.crashes.map(v=>v.ackToKillMs))});
 for(let i=0;i<5;i++){
  const before=expected;let acknowledged;
  const pending=rpc('add',{payload:{username:'bekleyen kayıt testi',authorId:'999903',text:`Henüz onaylanmayan deneme ${i}`}}).then(v=>{acknowledged=v;}).catch(()=>{});
  kill();await pending;await afterKill();const after=await current();
  for(const a of before.authors)assert.deepEqual(after.authors.find(x=>x.key===a.key),a,'Older author changed during in-flight kill');
  if(acknowledged)assert.equal(digest(after),digest(acknowledged));
  const newAuthor=after.authors.find(a=>a.username==='bekleyen kayıt testi');
  details.inflight.push({cycle:i+1,acknowledged:!!acknowledged,newNotePresent:!!newAuthor?.notes.some(n=>n.text.endsWith(String(i)))});expected=after;
 }
 record('Five crashes during unacknowledged requests preserve all previously saved authors/notes');
 const quota=await page.evaluate(()=>chrome.storage.local.QUOTA_BYTES);const big=fixture();big.authors=big.authors.slice(0,1);big.authors[0].key='quota-author';big.authors[0].username='kota testi';big.authors[0].authorId='999904';
 big.authors[0].notes=Array.from({length:Math.ceil((quota+2*1024*1024)/19000)},(_,i)=>({...big.authors[0].notes[0],id:`quota-${i}`,text:String(i)+'.'+'x'.repeat(18980),history:[],archivedAt:null}));
 let quotaError;try{await rpc('import',{backup:big,mode:'preserve',expectedRevision:expected.revision});}catch(e){quotaError=e.message;}
 assert(quotaError&&quotaError.includes('Depolama alanı doldu'));await same('quota failure');await restart();await same('quota failure after restart');record('Real storage quota overflow rejects the write and preserves all previous data, including after restart',{quotaBytes:quota,error:quotaError});
 const invalid=backup(expected);invalid.authors[0].notes[0].sourceUrl='javascript:alert(1)';let invalidError;
 try{await rpc('import',{backup:invalid,mode:'preserve',expectedRevision:expected.revision});}catch(e){invalidError=e.message;}
 assert(invalidError);await same('invalid import');record('Malformed backup import never overwrites the existing list');
 const exported=backup(expected);const expectedLogical=expected.authors.map(({key,...a})=>a);const savedProfile=profile;
 await ctx.close();await launch(task+'/recovery-profile');assert.equal((await current()).authors.length,0);
 await rpc('import',{backup:exported,mode:'preserve',expectedRevision:0});const recovered=await current();assert.equal(digest(recovered.authors.map(({key,...a})=>a)),digest(expectedLogical));
 await ctx.close();await launch(savedProfile);await same('original profile after recovery');record('JSON backup restores all notes/history/archive/tags into an independent fresh Chrome profile');
 const moved=task+'/same-build-different-folder';await cp(extension,moved,{recursive:true});const oldId=id;const oldState=expected;
 await ctx.close();await launch(profile,moved);assert.notEqual(id,oldId);assert.equal((await current()).authors.length,0);
 await ctx.close();await launch();assert.equal(id,oldId);await same('original identity after move demo');expected=oldState;record('Changing the unpacked install folder creates a different identity; original profile/ID still retains all records',{originalId:oldId});
 // Deliberately corrupt only this synthetic profile and ensure no new blank state is written.
 const prior=await current();let corruptionProtected=true;const failures=[];
 for(const invalid of [null,false,0,'']){
  await page.evaluate(async({key,value})=>chrome.storage.local.set({[key]:value}),{key,value:invalid});
  const read=await page.evaluate(()=>chrome.runtime.sendMessage({channel:'eksi-defter',op:'get'}));
  const write=await page.evaluate(()=>chrome.runtime.sendMessage({channel:'eksi-defter',op:'add',payload:{username:'bozuk kayıt',text:'Bu yazma reddedilmeli'}}));
  const stored=await page.evaluate(async key=>(await chrome.storage.local.get(key))[key],key);
  const ok=!read.ok&&!write.ok&&stored===invalid;if(!ok){corruptionProtected=false;failures.push({invalid,readOk:read.ok,writeOk:write.ok,storedType:typeof stored});}
 }
 await page.evaluate(async({key,value})=>chrome.storage.local.set({[key]:value}),{key,value:prior});expected=prior;
 if(corruptionProtected)record('Present-but-invalid storage is never silently replaced by an empty list');else results.push({name:'Present-but-invalid storage is never silently replaced by an empty list',pass:false,failures});
 const report={version:JSON.parse(await readFile(extension+'/manifest.json','utf8')).version,environment:'Chrome for Testing 151, real storage.local, isolated synthetic profiles; SIGKILL restricted to verified own browser PIDs',results,details,finalHash:digest(await current()),allPassed:results.every(r=>r.pass),timestamp:new Date().toISOString()};
 await writeFile(out+'/eksibellek-persistence-audit.json',JSON.stringify(report,null,2));console.log('REPORT',JSON.stringify({allPassed:report.allPassed,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass),output:out}));if(!report.allPassed)process.exitCode=1;
}catch(error){await writeFile(path.join(out,'persistence-failure.json'),JSON.stringify({allPassed:false,results,details,error:error.stack},null,2));throw error;}finally{try{await ctx?.close();}catch{}await rm(task,{recursive:true,force:true});}
