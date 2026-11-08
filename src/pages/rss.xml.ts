import { getCollection } from "astro:content";
import { SITE } from "../data/identity";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export async function GET() {
  const essays = (await getCollection("essays")).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const items = essays.map((e) => `<item><title>${esc(e.data.title)}</title><link>${SITE}/writing/${e.id}/</link><guid>${SITE}/writing/${e.id}/</guid><pubDate>${e.data.date.toUTCString()}</pubDate><description>${esc(e.data.dek ?? "")}</description></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Jay Sueno: The Long Paddle</title><link>${SITE}/writing/</link><description>Field notes on business, family, health, and becoming in Siargao.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
