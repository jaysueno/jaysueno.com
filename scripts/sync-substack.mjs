#!/usr/bin/env node
// Pulls The Long Paddle from its public RSS feed into src/content/essays as Markdown.
// Run by hand after publishing. Nothing posts anywhere. Jay's words stay as written.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";
import sharp from "sharp";

const FEED = "https://jaysueno.substack.com/feed";
const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "../src/content/essays");
mkdirSync(join(OUT, "img"), { recursive: true });
const SLUGS = { "gout-growth-starting-again-siargao": "always-be-ready" };
const SKIP = new Set(["coming-soon"]);

const td = new TurndownService({ headingStyle: "atx", emphasisDelimiter: "*", bulletListMarker: "-" });
td.remove(["script", "style", "iframe"]);
td.addRule("subscribeWidgets", {
  filter: (n) => n.nodeName === "DIV" && /subscription-widget|captioned-button|button-wrapper/.test(n.getAttribute("class") || ""),
  replacement: () => "",
});

td.addRule("linkedImage", {
  filter: (n) => n.nodeName === "A" && n.querySelector("img") && !n.textContent.trim(),
  replacement: (_c, n) => { const i = n.querySelector("img"); return `\n\n![${i.getAttribute("alt") || ""}](${i.getAttribute("src")})\n\n`; },
});

const xml = await (await fetch(FEED)).text();
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
const cdata = (tag, s) => (s.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)) || [])[1]?.trim() ?? "";
const q = (s) => JSON.stringify(s);
let n = 0;
for (const it of items) {
  const link = cdata("link", it);
  const key = new URL(link).pathname.split("/").pop();
  if (SKIP.has(key)) continue;
  const slug = SLUGS[key] ?? key;
  const title = cdata("title", it);
  const dek = cdata("description", it);
  const date = new Date(cdata("pubDate", it)).toISOString().slice(0, 10);
  const html = cdata("content:encoded", it);
  // House rule: no em dashes anywhere a person reads. This is the only change made to his words.
  let md = td.turndown(html).replace(/\n{3,}/g, "\n\n").trim().replace(/\s*\u2014\s*/g, ", ");
  // Keep the photos with the essays, so they don't depend on Substack's CDN.
  let i = 0;
  const urls = [...md.matchAll(/!\[([^\]]*)\]\((https:[^)\s]+)\)/g)];
  for (const m of urls) {
    i++;
    const file = `${slug}-${i}.jpg`;
    const buf = Buffer.from(await (await fetch(m[2])).arrayBuffer());
    await sharp(buf).rotate().resize({ width: 1400, withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, "img", file));
    md = md.replace(m[2], `./img/${file}`);
  }
  const fm = `---\ntitle: ${q(title)}\ndek: ${q(dek)}\ndate: ${date}\nsubstack: ${q(link)}\n---\n\n`;
  writeFileSync(join(OUT, `${slug}.md`), fm + md + "\n");
  console.log(slug, md.length, "chars,", (md.match(/!\[/g) || []).length, "images,", (md.match(/\u2014/g) || []).length, "em dashes");
  n++;
}
console.log(`${n} essays written`);
