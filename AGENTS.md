# AGENTS.md

Instructions for an AI coding agent working in this repo. This is a snapshot of a site whose
source of truth is a private monorepo; changes here do not reach the live site.

## Install, run, test

- Install: `pnpm install --frozen-lockfile` (Node 22.23.4 or newer, pnpm 10 via `corepack enable`).
- Run: `pnpm dev` serves the site on `http://localhost:4323`. `pnpm build` writes `dist/`;
  set `PUBLIC_CONTACT_EMAIL` for a real contact address. `pnpm preview` serves `dist/`.
- Test: `pnpm test` (runs `node --test` over `test/`). Run `pnpm build` too; it fails on an em
  dash in any page. Both must pass before every commit.
- Stop `pnpm dev` and `pnpm preview` when you are done with them.

## Where you may work

- `src/pages/`, `src/components/`, `src/layouts/`, `src/data/`, `src/styles/`: the site.
- `src/content/essays/`: only through `pnpm sync:essays`, or to fix markup. The words are the
  author's; never rewrite them.
- `scripts/`, `lib/`, `test/`, `supabase/functions/`.
- `supabase/migrations/`: add a new numbered file. Never edit one that has been applied.

## Where you may not work

- `src/vendor/`: copied from the monorepo's shared package. Keep it as is.
- `src/data/commits-daily.json`: generated counts for the code page.
- `site.config.ts` `supabase` block: the public URL and anon key are pinned on purpose.

## What you must never do

- Never add a tag manager, analytics tag or ad pixel. `test/snapshot.test.mjs` fails if you do.
- Never commit `.env`, a service key, a Resend key, or a real webhook secret. The migration keeps
  the placeholder `<set-in-supabase-vault>`.
- Never put a personal e-mail address, phone number or a private person's name in a file.
- Never write an em dash anywhere. The build fails on one in the output.
- Never deploy, push, or change repository settings unless your human asks.

## Before every commit

Run an identity and secret scan over the tree and the git history: no real addresses, names,
tokens, hosts or ids beyond what the live site already shows. The maintainer runs one outside
this repo; if you have no scanner, at least grep the diff for `@`, `token`, `key`, IP addresses
and long hex strings, and read every hit.
