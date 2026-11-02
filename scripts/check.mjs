import { readFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = new URL('../extension/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ['storage']);
assert.equal(manifest.host_permissions, undefined);
for (const item of Object.values(manifest.icons)) await stat(new URL(item, root));
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) await check(file);
    else if (entry.name.endsWith('.js')) execFileSync(process.execPath, ['--check', fileURLToPath(file)]);
    else if (entry.name.endsWith('.html')) {
      const text = await readFile(file, 'utf8');
      assert(!/<script[^>]*src=["']https?:/i.test(text), 'Remote scripts are forbidden');
      assert(!/\son\w+=/i.test(text), 'Inline event handlers are forbidden');
      assert(!/<script(?![^>]*src=)/i.test(text), 'Inline scripts are forbidden');
    }
  }
}
await check(root);
console.log('Manifest, icons, script syntax and CSP-safe HTML: OK');
