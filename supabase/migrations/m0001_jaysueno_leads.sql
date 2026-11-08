-- Migration m0001: jaysueno_leads
-- jaysueno.com: lead-capture table for the dedicated jaysueno Supabase project
-- (separate project from Vultun's and from Siargao Water's, a clean separation of
--  Jay's personal-brand inquiries from the business + the JV).
--
-- Mirrors the Siargao Water pattern (a sibling app in the monorepo) but folds the
-- soft-delete marker + status CHECK into 0001 since this is a fresh table (no
-- already-applied row to migrate around).
--
-- RLS posture: the public website (anon role) may INSERT a consented lead and
-- nothing else. No SELECT/UPDATE/DELETE for anon, so inquiry PII is never publicly
-- readable. Reads happen only with the service_role key (digest / admin), which
-- bypasses RLS.
--
-- Apply: paste into the Supabase SQL Editor → Run (OWNER applies; the developer
-- never runs DDL). Applied: <pending>

begin;

create table if not exists public.jaysueno_leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null,
  inquiry_type  text,                 -- 'Consulting' | 'Speaking' | 'General'
  message       text,
  source_page   text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_term      text,
  utm_content   text,
  user_agent    text,
  consent       boolean not null default false,
  status        text not null default 'new',
  deleted_at    timestamptz           -- soft-delete: NULL = live; set = hidden everywhere
);

comment on column public.jaysueno_leads.deleted_at is
  'Soft-delete timestamp. NULL = live lead; set = deleted/hidden. Undelete by '
  'setting back to NULL. Hard DELETE only via a guarded service_role retention sweep.';

-- Live-row read index (digest / admin sort by recency):
create index if not exists jaysueno_leads_active_idx
  on public.jaysueno_leads (created_at desc) where deleted_at is null;

-- Recently-deleted recovery index:
create index if not exists jaysueno_leads_deleted_idx
  on public.jaysueno_leads (deleted_at desc) where deleted_at is not null;

-- Lock status to a known funnel. Anon is pinned to 'new' by the insert policy;
-- this also constrains future service_role status updates.
alter table public.jaysueno_leads
  add constraint jaysueno_leads_status_check
  check (status in ('new','contacted','qualified','won','lost'));

alter table public.jaysueno_leads enable row level security;

-- Anon (the public website) can INSERT only, and only a consented, status='new'
-- row. Everything else is denied by the absence of a policy.
drop policy if exists "anon can insert consented leads" on public.jaysueno_leads;
create policy "anon can insert consented leads"
  on public.jaysueno_leads
  for insert
  to anon
  with check (consent = true and status = 'new');

grant insert on table public.jaysueno_leads to anon;

commit;

-- Self-verify: assert the table + live index + policy exist; fail loudly on drift.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'jaysueno_leads' and column_name = 'deleted_at'
  ) then
    raise exception 'jaysueno_leads.deleted_at missing after 0001';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'jaysueno_leads'
      and policyname = 'anon can insert consented leads'
  ) then
    raise exception 'jaysueno_leads anon insert policy missing after 0001';
  end if;
end $$;
