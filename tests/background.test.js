import test from 'node:test';
import assert from 'node:assert/strict';
let listener;
let storage={};
let failWrite=false;
let failRead=false;
let writeBarrier=null;
globalThis.chrome={
  storage:{local:{setAccessLevel:async()=>{},get:async key=>{await new Promise(r=>setTimeout(r,2));if(failRead)throw new Error('Storage read failed');return Object.hasOwn(storage,key)?structuredClone({[key]:storage[key]}):{};},set:async value=>{await new Promise(r=>setTimeout(r,2));if(failWrite)throw new Error('QUOTA_BYTES exceeded');if(writeBarrier){writeBarrier.started();await writeBarrier.release;}Object.assign(storage,structuredClone(value));}}},
  runtime:{id:'test',getURL:path=>`chrome-extension://test/${path}`,onMessage:{addListener:fn=>listener=fn},onConnect:{addListener:()=>{}}}
};
await import('../extension/background.js');
const sender={id:'test',url:'chrome-extension://test/pages/app.html'};
const call=(op,extra={},from=sender)=>new Promise(resolve=>listener({channel:'eksi-defter',op,...extra},from,resolve));
test('background integration: concurrent writes, restart-safe reads, restricted content access and atomic imports',async()=>{
  const jobs=Array.from({length:12},(_,i)=>call('add',{payload:{username:'sergezer',authorId:'70106',text:`Not ${i}`}}));
  const responses=await Promise.all(jobs);assert(responses.every(r=>r.ok));
  let read=await call('get');assert.equal(read.value.authors[0].notes.length,12);
  const content={id:'test',url:'https://eksisozluk.com/ornek--1'};
  assert.equal((await call('get',{},content)).ok,false);
  assert.equal((await call('add',{payload:{username:'sergezer',text:'injected'}},content)).ok,false);
  const lookup=await call('lookup',{authors:[{username:'sergezer',authorId:'70106'}]},content);
  assert.equal(lookup.value[0].count,12);assert.equal(lookup.value[0].text,undefined);
  const before=structuredClone(storage);failWrite=true;
  assert.equal((await call('add',{payload:{username:'sergezer',text:'failed'}})).ok,false);assert.deepEqual(storage,before);failWrite=false;
  const {backup}=await import('../extension/lib/model.js');const file=backup(read.value);
  const preview=await call('previewImport',{backup:file,mode:'preserve'});
  await call('add',{payload:{username:'sergezer',text:'Changed after preview'}});
  assert.equal((await call('import',{backup:file,mode:'preserve',expectedRevision:preview.value.revision})).ok,false);
  read=await call('get');assert.equal(read.value.authors[0].notes.length,13);
});
test('a successful save is acknowledged only after persistent storage completes',async()=>{
  const before=structuredClone(storage);
  let entered,unlock;
  const started=new Promise(resolve=>entered=resolve);
  const release=new Promise(resolve=>unlock=resolve);
  writeBarrier={started:entered,release};
  let acknowledged=false;
  const response=call('add',{payload:{username:'kalıcılık testi',text:'Yazma bitmeden başarı dönmemeli'}}).then(r=>{acknowledged=true;return r;});
  try{
    await started;
    assert.equal(acknowledged,false);
    assert.deepEqual(storage,before);
    unlock();
    assert.equal((await response).ok,true);
    assert.equal(storage['eksi-defter-v1'].authors.find(a=>a.username==='kalıcılık testi').notes[0].text,'Yazma bitmeden başarı dönmemeli');
  }finally{unlock();writeBarrier=null;}
});
test('a failed storage read never initializes or overwrites the saved list',async()=>{
  const before=structuredClone(storage);failRead=true;
  try{
    assert.equal((await call('get')).ok,false);
    assert.equal((await call('add',{payload:{username:'okuma hatası',text:'Kaydedilmemeli'}})).ok,false);
    assert.deepEqual(storage,before);
  }finally{failRead=false;}
});
test('present but invalid storage is not mistaken for a new empty install',async()=>{
  const saved=structuredClone(storage);
  try{
    for(const invalid of [null,false,0,'',[],{schemaVersion:1,authors:[]},{schemaVersion:1,authors:[],revision:0,settings:null}]){
      storage={'eksi-defter-v1':structuredClone(invalid)};
      const before=structuredClone(storage);
      assert.equal((await call('get')).ok,false,`Invalid record: ${JSON.stringify(invalid)}`);
      assert.equal((await call('add',{payload:{username:'bozuk kayıt',text:'Üzerine yazılmamalı'}})).ok,false);
      assert.deepEqual(storage,before);
    }
  }finally{storage=saved;}
});
test('trash updates page counts and a failed permanent delete keeps the stored note',async()=>{
  let result=await call('add',{payload:{username:'çöp kutusu testi',authorId:'991122',text:'Silme testi'}});
  let a=result.value.authors.find(a=>a.username==='çöp kutusu testi');let n=a.notes[0];
  result=await call('trash',{payload:{username:a.username,authorId:a.authorId,noteId:n.id,expectedVersion:n.version}});assert(result.ok);
  a=result.value.authors.find(a=>a.username==='çöp kutusu testi');n=a.notes[0];
  const content={id:'test',url:'https://eksisozluk.com/ornek--1'};
  const lookup=await call('lookup',{authors:[{username:a.username,authorId:a.authorId}]},content);assert.equal(lookup.value[0].count,0);
  assert.equal((await call('get')).value.authors.find(record=>record.username==='çöp kutusu testi').notes.length,1);
  const before=structuredClone(storage);failWrite=true;
  try{assert.equal((await call('purge',{payload:{username:a.username,authorId:a.authorId,noteId:n.id,expectedVersion:n.version}})).ok,false);assert.deepEqual(storage,before);}finally{failWrite=false;}
  result=await call('untrash',{payload:{username:a.username,authorId:a.authorId,noteId:n.id,expectedVersion:n.version}});assert(result.ok);
  assert.equal((await call('lookup',{authors:[{username:a.username,authorId:a.authorId}]},content)).value[0].count,1);
});
