// Git-derived sitemap `lastmod` for jaysueno.com.
//
// SOURCE
// Copied from the private monorepo's shared SEO package on 2026-11-08, so this snapshot builds
// on its own. Two changes from that copy: the repo root is this folder (the app sits at the
// root here, not under apps/), and `createGitLastmodResolver` takes an optional `root` so the
// tests can point it at a throwaway repo. The rules are unchanged:
//
// - lastmod is the date of the last commit that touched the files a page is built from,
//   never the build time. A date that moves on every deploy teaches Google to ignore the
//   field (https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping).
// - Shared chrome (Nav, Footer, the newsletter block, global.css) does not count.
//   A footer tweak is not a content change.
// - FAILURE MODE IS "OMIT", NEVER "GUESS". No git, no history, or a URL with no source
//   file: the URL ships with no lastmod, exactly like the stock @astrojs/sitemap output.
//
// astro.config.mjs lists, per URL, the files that hold that page's words. A listed file that
// does not exist stops the build: the list must stay in step with the page's imports, or it
// would date the page from files it no longer shows. A URL that is not listed falls back to
// its own route template (src/pages/<route>.astro or <route>/index.astro).
//
// In this public repo the whole history is one commit, so every page carries the snapshot date.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at lib/, so the repo root is one level up.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * One `git log` pass over the given repo-relative paths. Newest commit first, so the
 * first date seen for a path is its most recent change.
 *
 * @param {string[]} paths - repo-relative files
 * @param {string} root - the repo root to run git in
 * @returns {Map<string, string>} repo-relative path -> ISO 8601 commit date
 */
function gitLastCommitDates(paths, root) {
  const dates = new Map();
  if (!paths.length) return dates;

  let out;
  try {
    out = execFileSync("git", ["log", "--name-only", "--no-merges", "--format=%cI", "--", ...paths], {
      cwd: root,
      encoding: "utf-8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    // No git, no history, or a shallow clone without these paths: omit lastmod.
    return dates;
  }

  // Only the date is printed per commit, so every line is an ISO timestamp (a new
  // commit) or a file path; a commit message can never be misread as a path.
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}T[\d:]+[+-]\d{2}:\d{2}$/;
  let current;
  for (const raw of out.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (ISO_DATE.test(line)) {
      current = line;
      continue;
    }
    if (current && !dates.has(line)) dates.set(line, current);
  }
  return dates;
}

/**
 * Build a URL -> ISO-date resolver for @astrojs/sitemap's serialize() hook.
 *
 * @param {{ appPrefix: string, sources: Record<string, string[]>, root?: string }} opts
 *   appPrefix - the app's path from the repo root, "" when the app is the repo root
 *   sources   - URL pathname (with its trailing slash) -> repo-relative files that page is
 *               built from
 *   root      - optional repo root; defaults to this file's parent folder
 * @returns {(url: string) => string | undefined}
 */
export function createGitLastmodResolver({ appPrefix, sources, root = REPO_ROOT }) {
  const pre = appPrefix ? `${appPrefix}/` : "";
  const missing = Object.values(sources)
    .flat()
    .filter((file) => !existsSync(path.join(root, file)));
  if (missing.length) {
    throw new Error(
      `[sitemap-lastmod] ${pre}astro.config.mjs lists source files that do not exist: ${missing.join(", ")}. ` +
        "Update the list to match the page's imports.",
    );
  }

  const fallback = (pathname) => {
    const route = pathname.replace(/^\/|\/$/g, "");
    return route
      ? [`${pre}src/pages/${route}.astro`, `${pre}src/pages/${route}/index.astro`]
      : [`${pre}src/pages/index.astro`];
  };

  // Every file any page could be dated from, in one git pass. The fallback templates of
  // unlisted routes are found lazily below, so they are added per call when needed.
  const listed = [...new Set(Object.values(sources).flat())];
  let dates = gitLastCommitDates(listed, root);
  const looked = new Set(listed);

  return function lastmodFor(url) {
    let pathname;
    try {
      pathname = new URL(url).pathname;
    } catch {
      return undefined;
    }

    const candidates = sources[pathname] ?? fallback(pathname).filter((file) => existsSync(path.join(root, file)));
    const unseen = candidates.filter((file) => !looked.has(file));
    if (unseen.length) {
      for (const file of unseen) looked.add(file);
      dates = new Map([...gitLastCommitDates(unseen, root), ...dates]);
    }

    let newest;
    for (const file of candidates) {
      const when = dates.get(file);
      // A page is as fresh as the most recently changed file it is built from. Compared
      // as instants, not strings, so two commits with different UTC offsets still order.
      if (when && (!newest || Date.parse(when) > Date.parse(newest))) newest = when;
    }
    return newest;
  };
}
