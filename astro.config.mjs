import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { createGitLastmodResolver } from "./lib/sitemap-lastmod.mjs";

// Sitemap lastmod = the last commit that touched the files each page is built from, not
// the build time (lib/sitemap-lastmod.mjs explains why). Keep each list in
// step with the page's imports; shared chrome (Nav, Footer, the Subscribe block, global.css)
// is left out on purpose. Built lazily so `astro dev` never shells out to git.
const page = (route, ...data) => [`src/pages/${route}`, ...data.map((d) => `src/${d}`)];
const essay = (slug) => [`src/content/essays/${slug}.md`];
const LASTMOD_SOURCES = {
  "/": page("index.astro", "data/timeline.ts", "data/work.ts"),
  "/numbers/": page("numbers.astro", "data/numbers.ts"),
  "/shelf/": page("shelf.astro", "data/books.ts", "data/listening.ts"),
  "/resume/": page("resume.astro", "data/resume.ts"),
  "/open-to/": page("open-to.astro", "data/openTo.ts"),
  "/work-with-me/": page("work-with-me.astro", "data/offer.ts"),
  "/code/": page("code.astro", "data/commits-daily.json"),
  "/work/": page("work/index.astro", "data/work.ts"),
  "/work/vultun/": page("work/vultun.astro", "data/numbers.ts", "data/core-to-surf.json"),
  "/work/bizportal/": page("work/bizportal.astro", "data/numbers.ts"),
  "/writing/": page("writing/index.astro", "data/writing.ts"),
  "/writing/a-prayer-for-ember/": essay("a-prayer-for-ember"),
  "/writing/always-be-ready/": essay("always-be-ready"),
  "/writing/lets-begin-again/": essay("lets-begin-again"),
  "/writing/the-spear-and-the-net/": essay("the-spear-and-the-net"),
};

let resolver;
const lastmodFor = (url) => {
  resolver ??= createGitLastmodResolver({ appPrefix: "", sources: LASTMOD_SOURCES });
  return resolver(url);
};

export default defineConfig({
  site: "https://jaysueno.com",
  server: { port: 4323 },
  compressHTML: true,
  // Replaces the hand-written sitemap-index.xml / sitemap-0.xml that used to sit in
  // public/. Those were byte-copies of this integration's output, frozen 2026-06-19,
  // correct only for as long as the site stayed one page. Generated now, so it cannot
  // silently go stale. Static copies deleted in the same change to avoid a public/ vs
  // generated collision.
  integrations: [
    sitemap({
      serialize(item) {
        const lastmod = lastmodFor(item.url);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  vite: {
    build: { cssTarget: ["safari15", "ios15", "chrome100", "firefox100"] },
  },
});
