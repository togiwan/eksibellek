import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, mutate, resolveAuthor, username, sourceURL, backup, importBackup, validateBackup } from '../extension/lib/model.js';
const time='2026-11-02T12:00:00.000Z';
const add=(state,p={})=>mutate(state,'add',{username:'sergezer',text:'İlk gözlem',...p},time);
test('normalizes Turkish case, spaces and Unicode without conflating different names',()=>{
  assert.equal(username('  İSİM  SOYİSİM '),'isim soyisim');
  assert.notEqual(username('ışık'),username('isik'));
  assert.throws(()=>username('__proto__/x'));
});
test('source links reject script URLs, lookalike hosts and credentials',()=>{
  assert.equal(sourceURL('https://eksisozluk.com/entry/123'),'https://eksisozluk.com/entry/123');
  for(const url of ['javascript:alert(1)','https://eksisozluk.com.evil.test/','https://foo@eksisozluk.com/','https://eksisozluk.com:444/'])assert.throws(()=>sourceURL(url));
});
test('adding multiple notes is immutable and keeps timestamps and tags',()=>{
  const first=add(emptyState(),{tags:'havacılık, tekrar oku'});const second=add(first,{text:'İkinci gözlem'});
  assert.equal(first.authors[0].notes.length,1);assert.equal(second.authors[0].notes.length,2);
  assert.deepEqual(second.authors[0].tags,['havacılık','tekrar oku']);assert.equal(second.authors[0].notes[0].createdAt,time);
});
test('numeric identity can bind a manually entered name and follow a renamed user',()=>{
  const first=add(emptyState());const linked=add(first,{authorId:'70106'});const renamed=add(linked,{username:'yeni rumuz',authorId:'70106'});
  assert.equal(renamed.authors.length,1);assert.equal(renamed.authors[0].username,'yeni rumuz');assert(renamed.authors[0].aliases.includes('sergezer'));
});
test('different numeric accounts using the same name never share notes',()=>{
  const state=add(emptyState(),{authorId:'70106'});
  assert.equal(resolveAuthor(state,'sergezer','90000'),undefined);
  assert.equal(add(state,{authorId:'90000'}).authors.length,2);
});
test('edits keep the previous source and text, stale editors are rejected',()=>{
  const state=add(emptyState(),{sourceUrl:'https://eksisozluk.com/entry/123'});const note=state.authors[0].notes[0];
  const payload={username:'sergezer',noteId:note.id,expectedVersion:1,text:'Güncel gözlem',sourceUrl:''};
  const edited=mutate(state,'edit',payload,'2026-11-02T13:00:00.000Z');
  assert.equal(edited.authors[0].notes[0].history[0].text,'İlk gözlem');assert.equal(edited.authors[0].notes[0].history[0].sourceUrl,'https://eksisozluk.com/entry/123');
  assert.throws(()=>mutate(edited,'edit',payload),/başka bir pencerede/);
});
test('archive and restore preserve full note history',()=>{
  const state=add(emptyState());const note=state.authors[0].notes[0];
  const archived=mutate(state,'archive',{username:'sergezer',noteId:note.id,expectedVersion:1},time);
  const restored=mutate(archived,'restore',{username:'sergezer',noteId:note.id,expectedVersion:2});
  assert.equal(restored.authors[0].notes[0].archivedAt,null);assert.equal(restored.authors[0].notes[0].text,note.text);
});
test('export/import round trip retains notes, revisions and archive; replay is idempotent',()=>{
  let state=add(emptyState());const note=state.authors[0].notes[0];
  state=mutate(state,'edit',{username:'sergezer',noteId:note.id,expectedVersion:1,text:'Değişen not'});
  state=mutate(state,'archive',{username:'sergezer',noteId:note.id,expectedVersion:2});
  const file=backup(state);const imported=importBackup(emptyState(),file);
  assert.deepEqual(imported.state.authors[0].notes,state.authors[0].notes);
  assert.equal(importBackup(imported.state,file).report.newNotes,0);
});
test('same note ID with different text is kept as a separate note; reimport deduplicates',()=>{
  const state=add(emptyState());const raw=backup(state);raw.authors[0].notes[0].text='Dosyadaki farklı sürüm';
  const result=importBackup(state,raw);
  assert.equal(result.report.conflicts.length,1);assert.equal(result.state.authors[0].notes.length,2);
  assert.equal(result.state.authors[0].notes[0].text,'İlk gözlem');
  assert.equal(importBackup(result.state,raw).report.newNotes,0);
  assert.equal(importBackup(state,raw,'skip').state.authors[0].notes.length,1);
});
test('storage reordering of history object keys does not create import conflicts',()=>{
  const initial=add(emptyState());const note=initial.authors[0].notes[0];
  const state=mutate(initial,'edit',{username:'sergezer',noteId:note.id,expectedVersion:1,text:'Yeni metin'});
  const old=state.authors[0].notes[0].history[0];
  state.authors[0].notes[0].history[0]={savedAt:old.savedAt,sourceTitle:old.sourceTitle,sourceUrl:old.sourceUrl,text:old.text};
  const result=importBackup(state,backup(state));assert.equal(result.report.conflicts.length,0);assert.equal(result.report.newNotes,0);
});
test('malformed backup is rejected atomically and never changes existing data',()=>{
  const state=add(emptyState());const saved=structuredClone(state);const raw=backup(state);
  raw.authors.push({...raw.authors[0],key:'another',username:'ikinci',notes:[{...raw.authors[0].notes[0],sourceUrl:'javascript:alert(1)'}]});
  assert.throws(()=>importBackup(state,raw));assert.deepEqual(state,saved);
  assert.throws(()=>validateBackup({format:'eksi-defter',schemaVersion:3,authors:[]}));
});
test('untrusted backup object fields do not enter the data model',()=>{
  const raw=backup(add(emptyState()));raw.authors[0].notes[0].html='<script>bad()</script>';raw.authors[0].notes[0].text='<img src=x onerror=alert(1)>';
  const clean=validateBackup(raw);assert.equal(clean.authors[0].notes[0].html,undefined);assert.equal(clean.authors[0].notes[0].text,'<img src=x onerror=alert(1)>');
});
test('an export of an older revision leaves newer changes marked as unexported',()=>{
  const state=add(add(emptyState()));const exported=mutate(state,'exported',{revision:1});assert.equal(exported.lastExportRevision,1);assert.equal(exported.revision,2);
});
