import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,mutate,backup,importBackup,validateBackup,noteStatus} from '../extension/lib/model.js';
const time='2026-11-02T12:00:00.000Z';
const add=(state,name='sergezer',text='Korunacak not')=>mutate(state,'add',{username:name,text,tags:'troll, fake'},time);
const author=(state,name='sergezer')=>state.authors.find(a=>a.username===name);
const note=(state,name='sergezer')=>author(state,name).notes[0];
const change=(state,op,n=note(state),name='sergezer',extra={})=>mutate(state,op,{username:name,noteId:n.id,expectedVersion:n.version,...extra},time);
const selection=(state,name='sergezer',trash=false)=>author(state,name).notes.filter(n=>Boolean(n.trashedAt)===trash).map(n=>({id:n.id,version:n.version}));
test('legacy notes without a trash flag remain active or archived',()=>{
  assert.equal(noteStatus({archivedAt:null}),'active');
  assert.equal(noteStatus({archivedAt:time}),'archived');
  const old=backup(add(emptyState()));old.schemaVersion=1;delete old.authors[0].notes[0].trashedAt;
  assert.equal(importBackup(emptyState(),old).state.authors[0].notes[0].trashedAt,null);
});
test('trash and recovery retain text, source, history, author tags and original state',()=>{
  let state=add(emptyState());
  state=change(state,'edit',note(state),'sergezer',{text:'Güncel not',sourceUrl:'https://eksisozluk.com/entry/123',sourceTitle:'Kaynak'});
  const original=structuredClone(state);const n=note(state);
  const trashed=change(state,'trash');
  assert.equal(noteStatus(note(trashed)),'trash');assert.equal(note(trashed).version,n.version+1);
  assert.deepEqual(state,original);assert.deepEqual(note(trashed).history,n.history);
  const restored=change(trashed,'untrash');
  assert.equal(noteStatus(note(restored)),'active');assert.equal(note(restored).text,n.text);assert.equal(note(restored).sourceUrl,n.sourceUrl);
  assert.deepEqual(note(restored).history,n.history);assert.deepEqual(author(restored).tags,author(state).tags);
});
test('a note deleted from the archive returns to the archive',()=>{
  const archived=change(add(emptyState()),'archive');const trashed=change(archived,'trash');const restored=change(trashed,'untrash');
  assert.equal(noteStatus(note(restored)),'archived');assert.equal(note(restored).archivedAt,time);
});
test('trash cannot be edited or archived; live notes cannot be permanently deleted',()=>{
  const live=add(emptyState());assert.throws(()=>change(live,'purge'),/çöp kutusunda değil/);
  const trash=change(live,'trash');const before=structuredClone(trash);
  for(const op of ['edit','archive','restore','trash'])assert.throws(()=>change(trash,op),/çöp kutusunda/);
  assert.deepEqual(trash,before);
});
test('bulk author deletion includes archived notes, leaves previous trash and other authors intact',()=>{
  let state=add(add(add(emptyState())));state=change(state,'archive');state=change(state,'trash',author(state).notes[1]);state=add(state,'başka yazar','Ayrı kayıt');
  const other=structuredClone(author(state,'başka yazar'));const originalTrash=structuredClone(author(state).notes.find(n=>n.trashedAt));
  const trashed=mutate(state,'trashAuthor',{username:'sergezer',expectedNotes:selection(state)},time);
  assert(author(trashed).notes.every(n=>noteStatus(n)==='trash'));assert.deepEqual(author(trashed).notes.find(n=>n.id===originalTrash.id),originalTrash);assert.deepEqual(author(trashed,'başka yazar'),other);
  const restored=mutate(trashed,'untrashAuthor',{username:'sergezer',expectedNotes:selection(trashed,'sergezer',true)},time);
  assert.equal(author(restored).notes.filter(n=>noteStatus(n)==='archived').length,1);assert.equal(author(restored).notes.filter(n=>noteStatus(n)==='active').length,2);
});
test('stale bulk selections cannot delete newly added or edited notes',()=>{
  const state=add(emptyState());const expectedNotes=selection(state);const newer=add(state);const saved=structuredClone(newer);
  assert.throws(()=>mutate(newer,'trashAuthor',{username:'sergezer',expectedNotes}),/başka bir pencerede/);assert.deepEqual(newer,saved);
  const edited=change(state,'edit',note(state),'sergezer',{text:'Yeni metin'});
  assert.throws(()=>mutate(edited,'trashAuthor',{username:'sergezer',expectedNotes}),/başka bir pencerede/);
});
test('permanent deletion removes only the selected trash note; empty authors are removed',()=>{
  const two=add(add(emptyState()));const trash=change(two,'trash');const kept=structuredClone(author(trash).notes[1]);
  const purged=change(trash,'purge');assert.deepEqual(author(purged).notes,[kept]);
  const lastTrash=change(purged,'trash');const lastPurged=change(lastTrash,'purge');assert.equal(lastPurged.authors.length,0);
});
test('emptying trash preserves active/archived notes and rejects stale confirmation',()=>{
  let state=add(add(emptyState()));state=change(state,'trash');state=add(state,'başka yazar');state=change(state,'trash',note(state,'başka yazar'),'başka yazar');
  const kept=structuredClone(author(state).notes.find(n=>!n.trashedAt));
  const before=structuredClone(state);assert.throws(()=>mutate(state,'emptyTrash',{expectedRevision:state.revision-1}),/başka bir pencerede/);assert.deepEqual(state,before);
  const result=mutate(state,'emptyTrash',{expectedRevision:state.revision});assert.equal(result.authors.length,1);assert.deepEqual(author(result).notes,[kept]);
});
test('v2 JSON round trip preserves trash and history; repeat import creates no duplicates',()=>{
  let state=add(emptyState());state=change(state,'edit',note(state),'sergezer',{text:'Düzenlenmiş'});state=change(state,'archive');state=change(state,'trash');
  const file=backup(state);assert.equal(file.schemaVersion,2);const imported=importBackup(emptyState(),file).state;
  assert.deepEqual(author(imported).notes,author(state).notes);assert.equal(importBackup(imported,file).report.newNotes,0);
  const bad=structuredClone(file);bad.authors[0].notes[0].trashedAt='bozuk tarih';assert.throws(()=>validateBackup(bad));
  assert.throws(()=>validateBackup({...file,schemaVersion:3}));
});
test('import preview exposes trash/live conflicts and skip preserves the deletion',()=>{
  const live=add(emptyState());const file=backup(live);const trashed=change(live,'trash');
  const keep=importBackup(trashed,file,'skip');assert.equal(noteStatus(note(keep.state)),'trash');assert.equal(author(keep.state).notes.length,1);
  assert.equal(keep.report.conflicts[0].currentStatus,'trash');assert.equal(keep.report.conflicts[0].incomingStatus,'active');
  const preserve=importBackup(trashed,file);assert.equal(author(preserve.state).notes.filter(n=>noteStatus(n)==='trash').length,1);assert.equal(author(preserve.state).notes.filter(n=>noteStatus(n)==='active').length,1);
});
