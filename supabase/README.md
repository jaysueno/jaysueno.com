# jaysueno.com: Supabase (lead capture)

Schema and Edge Function for the site's own Supabase project. It lives inside the site folder so
it travels with the site. The project is separate from the ones the businesses use, so personal
inquiries stay apart from business data.

The flow:

```
form on jaysueno.com -> INSERT into jaysueno_leads (anon key, insert-only RLS)
   -> trigger on INSERT (m0002, pg_net) -> lead-notify Edge Function -> Resend
        |- alerts the owner (reply-to = the visitor)
        |- autoresponder to the visitor (consented only)
```

The newsletter is not here. It lives on Substack. This project is transactional lead capture only.

---

## One-time setup (about 15 minutes)

### 1. Create the Supabase project
- supabase.com -> New project. Pick the region closest to your visitors.
- Copy the **Project URL** and the **anon public** key into `site.config.ts` (the `supabase`
  block). The anon key is public by design; row-level security is the guard.
- Note the **service_role** key. Never commit it; it is only used as a function secret.

### 2. Apply the schema
- SQL Editor -> paste `migrations/m0001_jaysueno_leads.sql` -> Run.
- It verifies itself at the end (it raises if the table or policy is missing).

### 3. Verify Resend can send from your domain
- Resend -> Domains -> add your domain. Resend shows about three DNS records (SPF, DKIM and a
  return path). Add each one at your DNS host exactly as shown (DNS only, no proxy). Back in
  Resend, click Verify.
- Create a Resend **API key** scoped to that domain.

### 4. Deploy the Edge Function and its secrets
```bash
cd supabase
supabase link --project-ref <YOUR_PROJECT_REF>
supabase secrets set RESEND_API_KEY=<key> LEAD_NOTIFY_TO=hello@example.com \
  LEAD_FROM="Your Name <hello@example.com>" WEBHOOK_SECRET=<random-string>
supabase functions deploy lead-notify --no-verify-jwt
```
`LEAD_NOTIFY_TO` is required: the function returns 500 without it.

### 5. Store the webhook secret in Vault and apply the trigger
`m0002_jaysueno_leads_notify.sql` posts each new row to the function with an `x-webhook-secret`
header. In this public snapshot the header value is the placeholder `<set-in-supabase-vault>`.
The live value was never committed. Before you apply m0002:

1. Store the same random string you set as `WEBHOOK_SECRET` in Supabase Vault:
   `select vault.create_secret('<random-string>', 'lead_notify_webhook_secret');`
2. In m0002, replace `'<set-in-supabase-vault>'` with
   `(select decrypted_secret from vault.decrypted_secrets where name = 'lead_notify_webhook_secret')`,
   and replace the project URL with your own.
3. SQL Editor -> paste the edited m0002 -> Run.

Test: submit the form. You get the alert email, and the visitor gets the autoresponder.

---

## Migrations

| # | File | What | Applied on the live project |
|---|------|------|---------|
| m0001 | `m0001_jaysueno_leads.sql` | `jaysueno_leads` table, insert-only RLS, soft delete, status CHECK | 2026-06-19 |
| m0002 | `m0002_jaysueno_leads_notify.sql` | pg_net trigger: fires `lead-notify` on INSERT | 2026-06-20 |

`m####`, append-only. **Never edit an applied migration; add a new one.**

## Security
- The anon key is public by design; RLS is the guard. `jaysueno_leads` allows anon to
  **INSERT only** (consented, `status='new'`) and **never to read**, so inquiry details stay
  private.
- The service_role key, the Resend key and the webhook secret live only as function secrets and
  in Vault, never in the repo or the bundle.
