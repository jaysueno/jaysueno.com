-- Migration m0002: jaysueno_leads → lead-notify trigger (pg_net)
-- jaysueno.com: fire the `lead-notify` Edge Function on every new lead.
--
-- We use a pg_net trigger directly instead of the dashboard Database Webhook:
-- the dashboard wrapper needs Supabase's managed `supabase_functions` schema,
-- which isn't bootstrapped on this fresh project (ERROR 3F000). This does the
-- same thing (POST the row to the function) using pg_net's net.http_post.
--
-- Payload shape matches what the function checks: { type:'INSERT', table, record }.
-- The Authorization bearer is the PUBLIC anon key (RLS-guarded, already shipped in
-- the site bundle). It only satisfies the function's platform JWT gate; the real
-- guard is the x-webhook-secret header.
--
-- PUBLIC SNAPSHOT: the project URL, the anon key and the secret are placeholders. Before
-- you apply this, put in your project's URL and anon key, and replace
-- '<set-in-supabase-vault>' with your WEBHOOK_SECRET, or better, read it from Supabase
-- Vault (see supabase/README.md). The live project's secret was never committed here.
--
-- Apply: paste into the Supabase SQL Editor → Run (OWNER applies; the developer
-- never runs DDL). Requires the pg_net extension. Applied: 2026-06-20.

create extension if not exists pg_net;

create or replace function public.jaysueno_leads_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://YOUR-PROJECT.supabase.co/functions/v1/lead-notify',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'jaysueno_leads',
      'schema', 'public',
      'record', to_jsonb(new)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR-ANON-KEY',
      'x-webhook-secret', '<set-in-supabase-vault>'
    )
  );
  return new;
end;
$$;

drop trigger if exists jaysueno_leads_notify_trg on public.jaysueno_leads;
create trigger jaysueno_leads_notify_trg
  after insert on public.jaysueno_leads
  for each row execute function public.jaysueno_leads_notify();
