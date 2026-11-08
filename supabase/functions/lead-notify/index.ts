// jaysueno.com: lead-notify Edge Function.
//
// Fired by a Supabase Database Webhook on INSERT into public.jaysueno_leads.
// On each new inquiry it sends TWO emails via Resend (the jaysueno.com verified
// sending domain):
//   1. an internal notification to Jay (LEAD_NOTIFY_TO), reply-to = the visitor
//   2. an honest autoresponder to the visitor (consented inquiries only)
//
// NOTIFY-ONLY transactional responder. NOT a broadcast/drip; must never become
// one without an explicit, consented, --live path. (Newsletter lives on Substack.)
//
// Secrets (set with `supabase secrets set ...`):
//   RESEND_API_KEY   - a Resend API key on the verified jaysueno.com domain
//   LEAD_NOTIFY_TO   - required: inbox for new-inquiry alerts (e.g. hello@example.com)
//   LEAD_FROM        - optional, default 'Jay Sueno <hello@jaysueno.com>'
//   WEBHOOK_SECRET   - optional shared secret; if set, the webhook must send it as
//                      the `x-webhook-secret` header (abuse guard)
//
// Deploy (owner runs; see README in this folder):
//   supabase functions deploy lead-notify --no-verify-jwt

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const LEAD_NOTIFY_TO = Deno.env.get('LEAD_NOTIFY_TO') || '';
const LEAD_FROM = Deno.env.get('LEAD_FROM') || 'Jay Sueno <hello@jaysueno.com>';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || '';

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: LEAD_FROM, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) console.error(`Resend ${res.status}: ${await res.text()}`);
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!RESEND_API_KEY) return new Response('RESEND_API_KEY not set', { status: 500 });
  if (!LEAD_NOTIFY_TO) return new Response('LEAD_NOTIFY_TO not set', { status: 500 });

  let body: any;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const lead = body?.record;
  if (body?.type !== 'INSERT' || body?.table !== 'jaysueno_leads' || !lead) {
    return new Response('Ignored (not a jaysueno_leads insert)', { status: 200 });
  }

  const name = lead.name || 'there';
  const fields = ['name', 'email', 'inquiry_type', 'message', 'source_page']
    .filter((k) => lead[k])
    .map((k) => `<tr><td style="padding:3px 12px 3px 0;color:#9B9285;font:13px ui-monospace,monospace">${k}</td><td style="padding:3px 0;color:#1A1714;font:14px system-ui">${esc(lead[k])}</td></tr>`)
    .join('');

  // 1. Owner notification: reply goes straight to the visitor
  await sendEmail(
    LEAD_NOTIFY_TO,
    `New jaysueno.com inquiry: ${name}${lead.inquiry_type ? ' (' + lead.inquiry_type + ')' : ''}`,
    `<div style="font:15px system-ui;color:#1A1714"><p style="font:600 17px system-ui">New inquiry from jaysueno.com</p>
     <table style="border-collapse:collapse;margin:8px 0 16px">${fields}</table>
     <p style="color:#9B9285;font-size:13px">Reply to this email to reach ${esc(lead.email)} directly.</p></div>`,
    lead.email || undefined,
  );

  // 2. Visitor autoresponder (consented inquiries only; warm, honest, no over-promise)
  if (lead.consent === true && lead.email) {
    await sendEmail(
      lead.email,
      'Thanks for reaching out',
      `<div style="font:16px/1.6 system-ui;color:#2A2520;max-width:520px">
        <p>Hi ${esc(name)},</p>
        <p>Thanks for reaching out through jaysueno.com. Your message landed. I read every one personally, and I'll get back to you within a couple of days.</p>
        <p>If it's time-sensitive, just reply to this email and it'll come straight to me.</p>
        <p style="margin-top:22px">Thank you,<br><br><b>Jay Sueno</b><br>Founder: <a href="https://vultun.com/">Vultun Wellness</a> and <a href="https://vultun.com/feralpilates/">Feral Pilates</a>, Siargao<br>Instagram <a href="https://instagram.com/jay_sueno/">@jay_sueno</a><br>The Long Paddle: <a href="https://jaysueno.substack.com">jaysueno.substack.com</a><br><a href="https://jaysueno.com/">jaysueno.com</a></p>
      </div>`,
    );
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
