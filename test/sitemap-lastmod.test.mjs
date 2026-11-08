// lib/sitemap-lastmod.mjs against a throwaway git repo with fixed commit dates.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createGitLastmodResolver } from '../lib/sitemap-lastmod.mjs';

let repo;
let plain;
const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
const git = (args, date) =>
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', ...args], {
    cwd: repo,
    env: date ? { ...env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : env,
    stdio: 'ignore',
  });
const put = (file, text) => {
  mkdirSync(join(repo, file, '..'), { recursive: true });
  writeFileSync(join(repo, file), text);
};

before(() => {
  repo = mkdtempSync(join(tmpdir(), 'lastmod-'));
  plain = mkdtempSync(join(tmpdir(), 'lastmod-nogit-'));
  git(['init', '-q']);
  put('src/pages/index.astro', 'home');
  put('src/pages/numbers.astro', 'numbers');
  put('src/data/numbers.ts', 'export const n = 1;');
  put('src/pages/about.astro', 'about');
  git(['add', '.']);
  git(['commit', '-q', '-m', 'first'], '2030-01-01T10:00:00+08:00');
  put('src/data/numbers.ts', 'export const n = 2;');
  git(['commit', '-q', '-am', 'data only'], '2030-02-01T10:00:00+08:00');
  put('src/pages/index.astro', 'home, edited');
  git(['commit', '-q', '-am', 'home'], '2030-03-01T10:00:00+08:00');
  mkdirSync(join(plain, 'src/pages'), { recursive: true });
  writeFileSync(join(plain, 'src/pages/index.astro'), 'home');
});
after(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(plain, { recursive: true, force: true });
});

const sources = { '/numbers/': ['src/pages/numbers.astro', 'src/data/numbers.ts'] };

test('a listed page is as fresh as its newest source file', () => {
  const lastmod = createGitLastmodResolver({ appPrefix: '', sources, root: repo });
  assert.equal(lastmod('https://example.com/numbers/'), '2030-02-01T10:00:00+08:00');
});

test('an unlisted page falls back to its own route template', () => {
  const lastmod = createGitLastmodResolver({ appPrefix: '', sources, root: repo });
  assert.equal(lastmod('https://example.com/'), '2030-03-01T10:00:00+08:00');
  assert.equal(lastmod('https://example.com/about/'), '2030-01-01T10:00:00+08:00');
});

test('a page with no source file gets no lastmod', () => {
  const lastmod = createGitLastmodResolver({ appPrefix: '', sources, root: repo });
  assert.equal(lastmod('https://example.com/nowhere/'), undefined);
  assert.equal(lastmod('not a url'), undefined);
});

test('a listed file that does not exist stops the build', () => {
  assert.throws(
    () => createGitLastmodResolver({ appPrefix: '', sources: { '/x/': ['src/pages/gone.astro'] }, root: repo }),
    /lists source files that do not exist: src\/pages\/gone\.astro/,
  );
});

test('no git means omit, never guess', () => {
  const lastmod = createGitLastmodResolver({ appPrefix: '', sources: {}, root: plain });
  assert.equal(lastmod('https://example.com/'), undefined);
});
