#!/usr/bin/env node
// Runs after `astro build`. Three jobs, in this order:
// 1. Typographic quotes in visible text.
// 2. A Markdown twin next to every page, made from the same HTML so they cannot drift.
// 3. llms.txt, generated from the pages that actually exist.
// Then it fails the build if an em dash reached anything a human or agent reads.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "../dist");
const SITE = "https://jaysueno.com";
// The same variable the pages read; the fallback is a documentation address.
const CONTACT = process.env.PUBLIC_CONTACT_EMAIL || "hello@example.com";

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== "_astro" && f !== "media") walk(p, out); }
    else out.push(p);
  }
  return out;
}

// ---- 1. Quotes. Text nodes only: never scripts, styles, attributes, or code.
const curl = (t) =>
  t
    .replace(/(^|[\s(\[>])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(\w)'(\w)/g, "$1’$2")
    .replace(/(^|[\s(\[])'/g, "$1‘")
    .replace(/'/g, "’");
function typeset(html) {
  const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>|<textarea[\s\S]*?<\/textarea>|<title[\s\S]*?<\/title>|<[^>]+>)/i);
  return parts.map((p, i) => (i % 2 === 1 ? p : curl(p.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")))).join("");
}

// ---- 2. Markdown twins.
const td = new TurndownService({ headingStyle: "atx", emphasisDelimiter: "*", bulletListMarker: "-" });
td.remove(["script", "style", "svg", "form", "video", "button", "noscript", "dialog"]);
td.addRule("agentSkip", {
  filter: (n) => n.getAttribute && n.getAttribute("data-agent") === "skip",
  replacement: () => "",
});
td.addRule("linedText", {
  filter: (n) => n.nodeName === "SPAN" && n.parentNode && /\blines\b/.test(n.parentNode.getAttribute?.("class") ?? ""),
  replacement: (c) => `${c}\n`,
});
td.addRule("heading", {
  filter: ["h1", "h2", "h3", "h4"],
  replacement: (c, n) => `\n\n${"#".repeat(Number(n.nodeName[1]))} ${c.replace(/\s*\n\s*/g, " ").trim()}\n\n`,
});
td.addRule("picture", {
  filter: "picture",
  replacement: (_c, n) => {
    const img = n.querySelector("img");
    const alt = img?.getAttribute("alt");
    return alt ? `\n\n[Photo: ${alt}]\n\n` : "";
  },
});
td.addRule("img", {
  filter: "img",
  replacement: (_c, n) => { const a = n.getAttribute("alt"); return a ? `\n\n[Photo: ${a}]\n\n` : ""; },
});
td.addRule("absoluteLinks", {
  filter: (n) => n.nodeName === "A" && n.getAttribute("href"),
  replacement: (c, n) => {
    const h = n.getAttribute("href");
    const url = h.startsWith("/") ? SITE + h : h;
    return c.trim() ? `[${c.trim()}](${url})` : "";
  },
});
const meta = (html, name) => (html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`)) || [])[1] ?? "";
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const pages = [];
for (const file of walk(DIST).filter((f) => f.endsWith(".html"))) {
  const rel = relative(DIST, file);
  let html = typeset(readFileSync(file, "utf8"));
  writeFileSync(file, html);
  if (rel.startsWith("404")) continue;
  const route = `/${rel.replace(/index\.html$/, "")}`;
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] ?? "");
  const description = decode(meta(html, "description"));
  const main = (html.match(/<main[^>]*>([\s\S]*)<\/main>/) || [])[1] ?? "";
  const body = td.turndown(main).replace(/\n{3,}/g, "\n\n").trim();
  const updated = (html.match(/"dateModified":"([^"]+)"/) || [])[1] ?? "";
  const md = [`---`, `title: ${JSON.stringify(title)}`, `url: ${SITE}${route}`, `description: ${JSON.stringify(description)}`, updated ? `updated: ${updated}` : null, `author: Jay Sueno`, `---`, ``, body, ``, `---`, `Contact: ${CONTACT}. Site map for agents: ${SITE}/llms.txt`, ``].filter((l) => l !== null).join("\n");
  writeFileSync(join(dirname(file), "index.md"), md);
  pages.push({ route, title, description });
}

// ---- 3. llms.txt
const group = (prefix) => pages.filter((p) => p.route.startsWith(prefix)).sort((a, b) => a.route.localeCompare(b.route));
const line = (p) => `- [${p.title.replace(/ \| Jay Sueno$/, "")}](${SITE}${p.route}index.md): ${p.description}`;
const about = ["/about/", "/now/", "/open-to/", "/work-with-me/", "/resume/", "/numbers/", "/press/", "/shelf/", "/field-notes/", "/code/", "/agents/", "/colophon/"]
  .map((r) => pages.find((p) => p.route === r)).filter(Boolean);
const llms = `# Jay Sueno

> Jay Sueno is the founder and CEO of Vultun, a wellness group of ten business units on Siargao, a surf island in the southern Philippines. He writes The Long Paddle. He is forty-seven, seven years sober, and a father. He runs his company on software he directs AI coding agents to write.

Every page below has a Markdown twin at the link given. The same words are on the HTML page. Numbers carry their dates on the numbers page. Contact: ${CONTACT}.

## About Jay
${about.map(line).join("\n")}

## Work
${group("/work/").map(line).join("\n")}

## Writing
${group("/writing/").map(line).join("\n")}

## Machine-readable
- [resume.json](${SITE}/resume.json): The resume, in JSON Resume format.
- [rss.xml](${SITE}/rss.xml): The essays.
- [sitemap-index.xml](${SITE}/sitemap-index.xml): Every page.

## Elsewhere
- [Vultun](https://vultun.com): The company. Bookings and prices live there.
- [The Long Paddle on Substack](https://jaysueno.substack.com): Subscribe here.
- [Instagram](https://www.instagram.com/jay_sueno), [X](https://x.com/therealjaysueno), [LinkedIn](https://www.linkedin.com/in/jaysueno), [GitHub](https://github.com/jaysueno)
`;
writeFileSync(join(DIST, "llms.txt"), llms);

// ---- Em dash gate.
const offenders = [];
for (const f of walk(DIST).filter((f) => /\.(html|md|txt|json|xml)$/.test(f))) {
  const src = readFileSync(f, "utf8");
  const visible = f.endsWith(".html") ? src.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "") : src;
  if (visible.includes("\u2014")) offenders.push(relative(DIST, f));
}
if (offenders.length) {
  console.error(`postbuild: em dash found in: ${offenders.join(", ")}`);
  process.exit(1);
}
console.log(`postbuild: ${pages.length} pages typeset, ${pages.length} Markdown twins, llms.txt written, no em dashes.`);
