// Pure data operations. All persistent mutations are serialized by background.js.
// Stable identifier: existing JSON backups remain compatible after renaming.
export const FORMAT = 'eksi-defter';
export const SCHEMA = 1;
// Storage remains compatible with existing installations. New backups use v2 so
// older builds cannot silently discard trash flags and revive deleted notes.
export const BACKUP_SCHEMA = 2;
export const COLORS = ['green', 'blue', 'amber', 'rose', 'slate'];
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
const fail = message => { throw new Error(message); };
const str = (s, max, label, optional = false) => {
  if (typeof s !== 'string' || s.length > max || (!optional && !s.trim())) fail(`${label} geçersiz.`);
  return s.trim();
};
export function username(value) {
  const name = str(value, 80, 'Kullanıcı adı').normalize('NFC').replace(/\s+/g, ' ');
  if (/[\x00-\x1f<>/\\?#]/u.test(name)) fail('Kullanıcı adını yalnızca rumuz olarak yaz.');
  return name.toLocaleLowerCase('tr-TR');
}
export function authorId(value) {
  if (value == null || value === '') return null;
  if (!/^\d{1,16}$/.test(String(value))) fail('Yazar kimliği geçersiz.');
  return String(value);
}
export function sourceURL(value = '') {
  if (!value) return '';
  const url = new URL(str(value, 2000, 'Kaynak bağlantısı'));
  if (url.protocol !== 'https:' || !['eksisozluk.com', 'www.eksisozluk.com'].includes(url.hostname) || url.username || url.password || url.port) fail('Kaynak için bir https://eksisozluk.com bağlantısı kullan.');
  url.hash = '';
  return url.href;
}
export function tags(value) {
  const items = Array.isArray(value) ? value : String(value || '').split(',');
  if (items.length > 12) fail('En fazla 12 etiket ekleyebilirsin.');
  return [...new Set(items.map(v => str(v, 32, 'Etiket', true).normalize('NFC')).filter(Boolean))];
}
export function emptyState() {
  return { schemaVersion: SCHEMA, revision: 0, authors: [], settings: { theme: 'system', reminders: true }, lastExportAt: null, lastExportRevision: -1 };
}
export function resolveAuthor(state, name, id = null) {
  const canonical = username(name);
  const identity = authorId(id);
  if (identity) {
    const exact = state.authors.find(a => a.authorId === identity);
    if (exact) return exact;
  }
  // A known different numeric ID must never receive another account's notes.
  return state.authors.find(a => (a.username === canonical || a.aliases.includes(canonical)) && (!identity || !a.authorId));
}
export function noteStatus(note) {
  return note.trashedAt ? 'trash' : note.archivedAt ? 'archived' : 'active';
}
function checkSelection(notes, expected) {
  const signature = list => JSON.stringify(list.map(n => [n.id, n.version]).sort(([a], [b]) => a.localeCompare(b)));
  if (!Array.isArray(expected) || expected.some(n => !n || typeof n.id !== 'string' || !Number.isSafeInteger(n.version)) || signature(notes) !== signature(expected)) {
    fail('Yazarın notları başka bir pencerede değişti. Güncel listeyi açıp tekrar dene.');
  }
}
function snapshot(note) {
  return { text: note.text, sourceUrl: note.sourceUrl, sourceTitle: note.sourceTitle, savedAt: note.updatedAt };
}
export function mutate(state, operation, payload, now = new Date().toISOString(), uuid = () => crypto.randomUUID()) {
  const next = structuredClone(state);
  if (operation === 'emptyTrash') {
    if (payload.expectedRevision !== state.revision) fail('Çöp kutusu başka bir pencerede değişti. Güncel listeyi açıp tekrar dene.');
    if (!next.authors.some(a => a.notes.some(n => n.trashedAt))) fail('Çöp kutusu zaten boş.');
    next.authors = next.authors.filter(a => {
      const hadNotes = a.notes.length > 0;
      if (a.notes.some(n => n.trashedAt)) {
        a.notes = a.notes.filter(n => !n.trashedAt);
        a.updatedAt = now;
      }
      return !hadNotes || a.notes.length > 0;
    });
  } else if (operation === 'settings') {
    if (!['light', 'dark', 'system'].includes(payload.theme) || typeof payload.reminders !== 'boolean') fail('Ayarlar geçersiz.');
    next.settings = { theme: payload.theme, reminders: payload.reminders };
  } else if (operation === 'exported') {
    if (!Number.isSafeInteger(payload.revision) || payload.revision > state.revision || payload.revision < 0) fail('Yedek sürümü geçersiz.');
    next.lastExportAt = now;
    next.lastExportRevision = Math.max(next.lastExportRevision, payload.revision);
    return next;
  } else {
    const name = username(payload.username);
    const id = authorId(payload.authorId);
    let author = resolveAuthor(next, name, id);
    if (operation === 'add') {
      const text = str(payload.text, 20000, 'Not');
      const url = sourceURL(payload.sourceUrl);
      const title = str(payload.sourceTitle || '', 300, 'Başlık', true);
      if (!author) {
        author = { key: uuid(), username: name, authorId: id, aliases: [], tags: [], color: 'green', createdAt: now, updatedAt: now, notes: [] };
        next.authors.push(author);
      }
      if (id && !author.authorId) author.authorId = id;
      if (id && author.username !== name) {
        author.aliases = [...new Set([...author.aliases, author.username])];
        author.username = name;
      }
      if (payload.tags !== undefined) author.tags = tags(payload.tags);
      if (COLORS.includes(payload.color)) author.color = payload.color;
      author.notes.unshift({ id: uuid(), text, sourceUrl: url, sourceTitle: title, createdAt: now, updatedAt: now, version: 1, archivedAt: null, trashedAt: null, history: [] });
    } else {
      if (!author) fail('Yazar bulunamadı.');
      if (operation === 'trashAuthor' || operation === 'untrashAuthor') {
        const notes = author.notes.filter(n => operation === 'trashAuthor' ? !n.trashedAt : Boolean(n.trashedAt));
        if (!notes.length) fail(operation === 'trashAuthor' ? 'Silinecek not yok.' : 'Geri getirilecek not yok.');
        checkSelection(notes, payload.expectedNotes);
        for (const note of notes) {
          note.trashedAt = operation === 'trashAuthor' ? now : null;
          note.version += 1;
          note.updatedAt = now;
        }
      } else if (operation === 'profile') {
        author.tags = tags(payload.tags);
        if (!COLORS.includes(payload.color)) fail('Renk geçersiz.');
        author.color = payload.color;
      } else {
        const note = author.notes.find(n => n.id === payload.noteId);
        if (!note) fail('Not bulunamadı.');
        if (note.version !== payload.expectedVersion) fail('Bu not başka bir pencerede değişti. Güncel halini açıp tekrar dene.');
        if (note.trashedAt && !['untrash', 'purge'].includes(operation)) fail('Bu not çöp kutusunda. Önce geri getir.');
        if (['untrash', 'purge'].includes(operation) && !note.trashedAt) fail('Bu not çöp kutusunda değil.');
        if (operation === 'purge') {
          author.notes = author.notes.filter(n => n.id !== note.id);
          if (!author.notes.length) next.authors = next.authors.filter(a => a.key !== author.key);
        } else if (operation === 'edit') {
          const text = str(payload.text, 20000, 'Not');
          const url = sourceURL(payload.sourceUrl);
          const title = str(payload.sourceTitle || '', 300, 'Başlık', true);
          if (text !== note.text || url !== note.sourceUrl || title !== note.sourceTitle) {
            note.history.unshift(snapshot(note));
            Object.assign(note, { text, sourceUrl: url, sourceTitle: title });
          }
        } else if (operation === 'trash') note.trashedAt = now;
        else if (operation === 'untrash') note.trashedAt = null;
        else if (operation === 'archive') note.archivedAt = now;
        else if (operation === 'restore') note.archivedAt = null;
        else fail('İşlem tanınmadı.');
        note.version += 1;
        note.updatedAt = now;
      }
    }
    author.updatedAt = now;
  }
  next.revision += 1;
  return next;
}
const date = value => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) fail('Yedekteki tarih geçersiz.');
  return new Date(value).toISOString();
};
function revision(raw) {
  return { text: str(raw.text, 20000, 'Geçmiş notu'), sourceUrl: sourceURL(raw.sourceUrl), sourceTitle: str(raw.sourceTitle || '', 300, 'Başlık', true), savedAt: date(raw.savedAt) };
}
export function validateBackup(raw) {
  if (!raw || raw.format !== FORMAT || ![1, BACKUP_SCHEMA].includes(raw.schemaVersion) || !Array.isArray(raw.authors) || raw.authors.length > 20000) fail('Bu dosya desteklenen bir EkşiBellek yedeği değil.');
  let total = 0;
  const keys = new Set();
  const identities = new Set();
  const authors = raw.authors.map(a => {
    const name = username(a.username);
    const id = authorId(a.authorId);
    const key = str(a.key, 100, 'Yazar anahtarı');
    if (keys.has(key) || identities.has(id ? `id:${id}` : `name:${name}`)) fail('Yedekte yinelenen yazar kaydı var.');
    keys.add(key); identities.add(id ? `id:${id}` : `name:${name}`);
    if (!Array.isArray(a.notes) || !Array.isArray(a.aliases) || a.aliases.length > 200) fail('Yazar kaydı geçersiz.');
    const noteIds = new Set();
    const notes = a.notes.map(n => {
      if (++total > 50000 || !Array.isArray(n.history)) fail('Yedekte çok fazla veya geçersiz not var.');
      const noteId = str(n.id, 150, 'Not kimliği');
      if (noteIds.has(noteId)) fail('Yedekte yinelenen not kimliği var.');
      noteIds.add(noteId);
      if (!Number.isSafeInteger(n.version) || n.version < 1) fail('Not sürümü geçersiz.');
      return { id: noteId, text: str(n.text, 20000, 'Not'), sourceUrl: sourceURL(n.sourceUrl), sourceTitle: str(n.sourceTitle || '', 300, 'Başlık', true), createdAt: date(n.createdAt), updatedAt: date(n.updatedAt), version: n.version, archivedAt: n.archivedAt ? date(n.archivedAt) : null, trashedAt: n.trashedAt == null ? null : date(n.trashedAt), history: n.history.map(h => { if (++total > 50000) fail('Yedek çok büyük.'); return revision(h); }) };
    });
    return { key, username: name, authorId: id, aliases: [...new Set(a.aliases.map(username))], tags: tags(a.tags), color: COLORS.includes(a.color) ? a.color : 'green', createdAt: date(a.createdAt), updatedAt: date(a.updatedAt), notes };
  });
  return { format: FORMAT, schemaVersion: BACKUP_SCHEMA, authors };
}
export function backup(state, now = new Date().toISOString()) {
  return { format: FORMAT, schemaVersion: BACKUP_SCHEMA, exportedAt: now, revision: state.revision, authors: structuredClone(state.authors).map(a => ({ ...a, notes: a.notes.map(n => ({ ...n, trashedAt: n.trashedAt || null })) })) };
}
// Chrome storage may reorder object keys; compare explicit field arrays instead.
const content = n => JSON.stringify([n.text, n.sourceUrl, n.sourceTitle, n.archivedAt, n.trashedAt || null, n.history.map(h => [h.text, h.sourceUrl, h.sourceTitle, h.savedAt])]);
export function importBackup(state, raw, mode = 'preserve', uuid = () => crypto.randomUUID()) {
  if (!['preserve', 'skip'].includes(mode)) fail('İçe aktarma seçimi geçersiz.');
  const incoming = validateBackup(raw);
  const next = structuredClone(state);
  const report = { newAuthors: 0, newNotes: 0, duplicates: 0, conflicts: [], metadataConflicts: 0 };
  for (const imported of incoming.authors) {
    let existing = resolveAuthor(next, imported.username, imported.authorId);
    if (!existing) {
      const record = structuredClone(imported);
      // Keys are internal; don't allow a colliding imported key to select another author.
      record.key = uuid();
      next.authors.push(record);
      report.newAuthors++; report.newNotes += record.notes.length;
      continue;
    }
    if (JSON.stringify([existing.tags, existing.color]) !== JSON.stringify([imported.tags, imported.color])) report.metadataConflicts++;
    // Existing display metadata wins. Incoming labels are combined without losing labels.
    existing.tags = [...new Set([...existing.tags, ...imported.tags])];
    if (existing.tags.length > 12) fail('Birleştirme 12 etiket sınırını aşıyor. Yedekteki etiketleri düzenle.');
    if (!existing.authorId && imported.authorId) existing.authorId = imported.authorId;
    existing.aliases = [...new Set([...existing.aliases, ...imported.aliases])];
    if (existing.username !== imported.username) existing.aliases.push(imported.username);
    for (const note of imported.notes) {
      const exact = existing.notes.find(n => n.id === note.id);
      const duplicate = existing.notes.find(n => content(n) === content(note));
      if (duplicate) { report.duplicates++; continue; }
      if (exact) {
        report.conflicts.push({ username: existing.username, current: exact.text, incoming: note.text, currentStatus: noteStatus(exact), incomingStatus: noteStatus(note) });
        if (mode === 'skip') continue;
      }
      const copied = structuredClone(note);
      if (exact) copied.id = uuid();
      existing.notes.push(copied);
      report.newNotes++;
    }
    existing.notes.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (Date.parse(imported.updatedAt) > Date.parse(existing.updatedAt)) existing.updatedAt = imported.updatedAt;
  }
  next.revision++;
  return { state: next, report };
}
