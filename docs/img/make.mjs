// Builds the two diagrams in this folder. Node standard library only, deterministic.
//
//   node docs/img/make.mjs
//
// lead-form.svg follows supabase/ (m0001, m0002 and the lead-notify function); build.svg follows
// the build steps in the README's "How it works" block. home-1440.png is a screenshot of a local
// build, not made here.
//
// Every shape is a filled rect or polygon and every label is a plain <text>, so the files render
// the same in a browser and in ImageMagick's built-in SVG reader.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const NAVY = '#001B3B';
const SAND = '#EDE7DC';
const TERRA = '#8C5348';
const HEAD = '#F2EDE2';
const SECOND = '#D8D3CA';
const SERIF = "Georgia, 'Playfair Display', serif";
const SANS = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = (n) => Math.round(n * 10) / 10;

function rect(x, y, w, h, fill, extra = '') {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
}

function poly(points, fill) {
  return `<polygon points="${points.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="${fill}"/>`;
}

function text(x, y, s, { size = 15, family = SANS, fill = SECOND, weight, anchor } = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-family="${family}"`, `font-size="${size}"`, `fill="${fill}"`];
  if (weight) a.push(`font-weight="${weight}"`);
  if (anchor) a.push(`text-anchor="${anchor}"`);
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}

// A border drawn as two filled rects, so no renderer has to draw a stroke.
function frame(x, y, w, h, outer, inner, t = 1) {
  return rect(x, y, w, h, outer) + rect(x + t, y + t, w - 2 * t, h - 2 * t, inner);
}

function arrowRight(x1, x2, y, color = TERRA) {
  const head = 14;
  return rect(x1, y - 2, x2 - x1 - head + 1, 4, color) +
    poly([[x2 - head, y - 9], [x2, y], [x2 - head, y + 9]], color);
}

function cross(cx, cy, size, color) {
  const s = size / 2;
  const t = 3;
  return poly([[cx - s, cy - s + t], [cx - s + t, cy - s], [cx + s, cy + s - t], [cx + s - t, cy + s]], color) +
    poly([[cx + s - t, cy - s], [cx + s, cy - s + t], [cx - s + t, cy + s], [cx - s, cy + s - t]], color);
}

function box(x, y, w, h, head, lines, { headSize = 22, lineGap = 22 } = {}) {
  const out = [frame(x, y, w, h, SAND, NAVY)];
  out.push(text(x + 18, y + 38, head, { size: headSize, family: SERIF, fill: HEAD }));
  lines.forEach((line, i) => out.push(text(x + 18, y + 70 + i * lineGap, line)));
  return out.join('\n');
}

function svg(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">\n` +
    `<title id="t">${esc(title)}</title>\n<desc id="d">${esc(desc)}</desc>\n${body.join('\n')}\n</svg>\n`;
}

function write(name, content) {
  if (content.includes(String.fromCharCode(0x2014))) throw new Error(`${name}: em dash in output`);
  writeFileSync(join(HERE, name), content);
  console.log(`wrote docs/img/${name} (${content.length} bytes)`);
}

// ---------- lead-form.svg ----------
{
  const W = 1200;
  const H = 500;
  const steps = [
    ['Lead form', ['on the site, sent', 'with the public', 'anon key']],
    ['jaysueno_leads', ['row-level security:', 'anon can INSERT a', 'consented lead with', 'status set to new']],
    ['Trigger m0002', ['on INSERT, pg_net', 'posts the row with', 'an x-webhook-secret', 'header']],
    ['lead-notify', ['Edge Function.', 'Checks the header,', 'then sends through', 'Resend']],
    ['Two emails', ['an alert to the', 'owner, and a short', 'reply to the visitor']],
  ];
  const gap = 44;
  const bw = (W - 80 - gap * 4) / 5;
  const by = 128;
  const bh = 178;
  const xs = steps.map((_, i) => 40 + i * (bw + gap));
  const body = [frame(0, 0, W, H, SAND, NAVY)];
  body.push(text(40, 62, 'The lead form', { size: 34, family: SERIF, fill: HEAD }));
  body.push(text(40, 94, 'The public key can insert a lead. It can never read one.', { size: 16 }));
  steps.forEach(([head, lines], i) => {
    body.push(box(xs[i], by, bw, bh, head, lines));
    if (i < steps.length - 1) body.push(arrowRight(xs[i] + bw + 6, xs[i + 1] - 6, by + bh / 2));
  });

  // What the anon key cannot do: the read path back to the browser, crossed out.
  const dy = by + bh + 44;
  const c0 = xs[0] + bw / 2;
  body.push(rect(xs[1] + bw / 2 - 2, by + bh, 4, dy - by - bh + 2, TERRA));
  body.push(rect(c0 - 2, dy - 2, xs[1] + bw / 2 - c0 + 2, 4, TERRA));
  body.push(rect(c0 - 2, by + bh + 14, 4, dy - by - bh - 12, TERRA));
  body.push(poly([[c0 - 9, by + bh + 15], [c0, by + bh + 1], [c0 + 9, by + bh + 15]], TERRA));
  body.push(cross((xs[0] + xs[1] + bw) / 2, dy, 26, HEAD));
  body.push(text(xs[0], dy + 40, 'The anon key cannot read,', { size: 15, fill: HEAD }));
  body.push(text(xs[0], dy + 62, 'update or delete a lead. No policy allows it.', { size: 15, fill: HEAD }));

  // Where the two secrets live.
  const cy = by + bh + 34;
  const ch = 118;
  const callouts = [
    [2, 'Vault', ['holds the webhook', 'secret the trigger', 'sends']],
    [3, 'Function secrets', ['Resend key, alert', 'inbox, the same', 'webhook secret']],
  ];
  for (const [i, head, lines] of callouts) {
    body.push(rect(xs[i] + bw / 2 - 2, by + bh, 4, cy - by - bh, TERRA));
    body.push(frame(xs[i], cy, bw, ch, TERRA, NAVY, 2));
    body.push(text(xs[i] + 18, cy + 30, head, { size: 19, family: SERIF, fill: HEAD }));
    lines.forEach((line, j) => body.push(text(xs[i] + 18, cy + 56 + j * 21, line)));
  }
  body.push(text(xs[4], cy + 30, 'Secrets never ship', { size: 15, fill: HEAD }));
  body.push(text(xs[4], cy + 52, 'in the repo or the', { size: 15 }));
  body.push(text(xs[4], cy + 74, 'page bundle.', { size: 15 }));

  write('lead-form.svg', svg(W, H, 'The lead form',
    'The lead form in five steps: the browser inserts a consented lead with the public anon key, row-level security allows insert only, trigger m0002 posts the row with a webhook secret header, the lead-notify Edge Function checks it and sends two emails through Resend; the webhook secret lives in Vault and in the function secrets, and the anon key cannot read a lead.', body));
}

// ---------- build.svg ----------
{
  const W = 1200;
  const H = 470;
  const top = 150;
  const bottom = 420;
  const cols = [
    ['Plain files', 230],
    ['Build', 190],
    ['Output', 170],
    ['Postbuild', 240],
    ['Served', 170],
  ];
  const gap = (W - 80 - cols.reduce((s, [, w]) => s + w, 0)) / 4;
  const xs = [];
  let x = 40;
  for (const [, w] of cols) {
    xs.push(x);
    x += w + gap;
  }
  const body = [frame(0, 0, W, H, SAND, NAVY)];
  body.push(text(40, 62, 'How the site is built', { size: 34, family: SERIF, fill: HEAD }));
  body.push(text(40, 94, 'Plain files in, static files out.', { size: 16 }));
  cols.forEach(([label], i) => body.push(text(xs[i], top - 14, label, { size: 14 })));

  // Written as "folder/ (*.ext)": a slash right before an asterisk reads as a comment opener in
  // ImageMagick's SVG reader, which then drops the rest of the label.
  const inputs = ['src/pages/ (*.astro)', 'src/data/ (*.ts)', 'src/content/essays/ (*.md)', 'src/assets/photos/ (*.jpg)'];
  const ih = 54;
  const ig = (bottom - top - ih * inputs.length) / (inputs.length - 1);
  inputs.forEach((label, i) => {
    const y = top + i * (ih + ig);
    body.push(frame(xs[0], y, cols[0][1], ih, SAND, NAVY));
    body.push(text(xs[0] + 16, y + 33, label, { size: 15, fill: HEAD }));
    body.push(arrowRight(xs[0] + cols[0][1] + 6, xs[1] - 6, y + ih / 2));
  });

  const h = bottom - top;
  body.push(box(xs[1], top, cols[1][1], h, 'astro build', ['@astrojs/sitemap', '', 'sharp makes AVIF', 'and WebP from', 'each photo']));
  body.push(box(xs[2], top, cols[2][1], h, 'dist/', ['25 HTML pages', 'rss.xml', 'resume.json', 'sitemap']));
  body.push(box(xs[3], top, cols[3][1], h, 'postbuild', [
    'postbuild-agents.mjs', '', 'typographic quotes', 'an index.md twin next', 'to every page but 404', 'llms.txt from the pages', 'fails on any em dash',
  ]));
  body.push(box(xs[4], top, cols[4][1], h, 'Static files', ['served as is']));
  for (let i = 1; i < 4; i++) body.push(arrowRight(xs[i] + cols[i][1] + 6, xs[i + 1] - 6, top + h / 2));

  write('build.svg', svg(W, H, 'How the site is built',
    'The build in five columns: pages, data, essays and photos go through astro build, which writes 25 HTML pages, rss.xml, resume.json and a sitemap to dist/, then scripts/postbuild-agents.mjs adds typographic quotes, Markdown twins and llms.txt and fails on any em dash, and the static files are served as is.', body));
}
