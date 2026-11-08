// Guards on the snapshot's source tree. They run in about a second, with no network and no build.
// Each one pins a promise the README makes. Some patterns are built from pieces so this file does
// not trip the same text searches it runs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['node_modules', 'dist', '.astro', '.git']);
const TEXT = new Set(['.astro', '.ts', '.mjs', '.js', '.json', '.md', '.css', '.sql', '.txt', '.yml', '.svg', '.xml']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk(ROOT);
const textFiles = files.filter((f) => TEXT.has(extname(f).toLowerCase()) && !f.endsWith('pnpm-lock.yaml'));
const read = (f) => readFileSync(f, 'utf8');
const rel = (f) => relative(ROOT, f);

test('no tag manager, analytics tag or ad pixel code ships', () => {
  const needles = ['google' + 'tagmanager', 'g' + 'tag(', 'fb' + 'q(', 'data' + 'Layer', 'GTM' + '-'];
  const hits = textFiles.filter((f) => needles.some((n) => read(f).includes(n))).map(rel);
  assert.deepEqual(hits, []);
});

test('the webhook secret is a placeholder in every migration that sends it', () => {
  const migs = files.filter((f) => f.includes(`${'supabase'}/migrations/`) && read(f).includes('x-webhook-secret'));
  assert.ok(migs.length >= 1, 'expected the notify migration');
  for (const f of migs) {
    const s = read(f);
    assert.ok(s.includes("'<set-in-supabase-vault>'"), `${rel(f)} has no placeholder`);
    assert.equal(/x-webhook-secret[\s\S]{0,80}?["'][0-9a-fA-F]{16,}["']/i.test(s), false, `${rel(f)} holds a hex value`);
  }
});

test('site.config.ts and m0002 ship placeholders, not the live project', () => {
  const s = read(join(ROOT, 'site.config.ts'));
  assert.equal((s.match(/url:\s*"([^"]+)"/) || [])[1], 'https://YOUR-PROJECT.supabase.co');
  assert.equal((s.match(/anonKey:\s*"([^"]+)"/) || [])[1], 'YOUR-ANON-KEY');
  const m = read(join(ROOT, 'supabase/migrations/m0002_jaysueno_leads_notify.sql'));
  assert.ok(m.includes("'https://YOUR-PROJECT.supabase.co/functions/v1/lead-notify'"));
  assert.ok(m.includes("'Bearer YOUR-ANON-KEY'"));
  const jwtStart = 'ey' + 'J';
  assert.deepEqual(textFiles.filter((f) => read(f).includes(jwtStart)).map(rel), []);
});

test('the lead form stays unconfigured while either value is a placeholder', () => {
  const s = read(join(ROOT, 'src/components/LeadForm.astro'));
  const src = (s.match(/const isSet = (\(v: string\) => [^;]+);/) || [])[1];
  assert.ok(src, 'isSet guard missing');
  const isSet = new Function(`return ${src.replace(': string', '')}`)();
  assert.equal(isSet('https://YOUR-PROJECT.supabase.co'), false);
  assert.equal(isSet('YOUR-ANON-KEY'), false);
  assert.equal(isSet(''), false);
  assert.equal(isSet('https://abc.supabase.co'), true);
  assert.match(s, /const configured = isSet\(sb\.url\) && isSet\(sb\.anonKey\);/);
  assert.match(s, /SB_URL: configured \? sb\.url : "", SB_KEY: configured \? sb\.anonKey : ""/);
});

test('no personal mail address and no private package import in the source', () => {
  const needles = ['g' + 'mail', '@' + 'vultun/', '/Us' + 'ers/'];
  const hits = textFiles.filter((f) => needles.some((n) => read(f).toLowerCase().includes(n.toLowerCase()))).map(rel);
  assert.deepEqual(hits, []);
});

test('the contact address comes from PUBLIC_CONTACT_EMAIL with a documentation fallback', () => {
  const id = read(join(ROOT, 'src/data/identity.ts'));
  assert.match(id, /email: import\.meta\.env\.PUBLIC_CONTACT_EMAIL \|\| "hello@example\.com"/);
  assert.match(read(join(ROOT, 'scripts/postbuild-agents.mjs')), /process\.env\.PUBLIC_CONTACT_EMAIL \|\| "hello@example\.com"/);
});

test('no em dash in any source file', () => {
  const hits = textFiles.filter((f) => read(f).includes('\u2014')).map(rel);
  assert.deepEqual(hits, []);
});

test('no file name with a space', () => {
  assert.deepEqual(files.map(rel).filter((p) => p.includes(' ')), []);
});

test('every photo id a page asks for exists in src/assets/photos', () => {
  const have = new Set(readdirSync(join(ROOT, 'src/assets/photos')).filter((f) => f.endsWith('.jpg')).map((f) => f.slice(0, -4)));
  const wanted = new Set();
  for (const f of textFiles.filter((p) => p.includes(`${'src'}/`))) {
    const s = read(f);
    for (const m of s.matchAll(/<(?:Photo|Fig)\b[^>]*?\bid="([^"]+)"/g)) wanted.add(m[1]);
    for (const m of s.matchAll(/\bphoto: "([^"]+)"/g)) wanted.add(m[1]);
    for (const m of s.matchAll(/\[\s*"(slide-\d+)"/g)) wanted.add(m[1]);
  }
  const covers = read(join(ROOT, 'src/data/essay-covers.ts'));
  for (const m of covers.matchAll(/\bid: "([^"]+)"/g)) wanted.add(m[1]);
  assert.ok(wanted.size > 20, `only ${wanted.size} ids found; the parser is broken`);
  assert.deepEqual([...wanted].filter((id) => !have.has(id)).sort(), []);
});

test('the commit-count data the code page draws is present and plain counts', () => {
  const p = join(ROOT, 'src/data/commits-daily.json');
  assert.ok(existsSync(p));
  const d = JSON.parse(read(p));
  const values = JSON.stringify(d).match(/"[^"]*"\s*:\s*"[^"]*"/g) || [];
  assert.ok(JSON.stringify(d).length > 100);
  assert.equal(values.filter((v) => /@|http/.test(v)).length, 0);
});

test('nothing reaches outside this folder for code', () => {
  const hits = textFiles
    .filter((f) => /\.(astro|ts|mjs|js|json)$/.test(f))
    .filter((f) => /(from\s+["']|import\s*\(\s*["'])(\.\.\/){2,}(\.\.\/)*(packages|vultun|apps)\//.test(read(f)))
    .map(rel);
  assert.deepEqual(hits, []);
});
