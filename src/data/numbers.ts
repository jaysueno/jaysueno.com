// Every number carries its date and where it came from.
const PRESS = "https://vultun.com/press/";
export const business = [
  { value: "13,543", label: "People in the books at Vultun.", note: "October 2026. vultun.com/press", href: PRESS },
  { value: "8,121", label: "Sessions in the last twelve months.", note: "October 2026. vultun.com/press", href: PRESS },
  { value: "4.93", label: "Average across 468 Google reviews, every location.", note: "Read from Google, November 7, 2026", href: PRESS },
  { value: "3,506", label: "Pilates sessions to 1,520 guests in twelve months. One in three reformer guests come back.", note: "Feral Pilates. October 2026. vultun.com/press", href: PRESS },
  { value: "5.0", label: "Feral Pilates, from 60 Google reviews.", note: "Read from Google, November 7, 2026", href: PRESS },
  { value: "10", label: "Business units, on two sites: Jacking Horse and Malinao.", note: "Vultun press kit, October 2026", href: PRESS },
];
export const software = [
  { value: "191,412", label: "Lines of TypeScript in BizPortal. 959 files. 125 test files.", note: "Counted November 3, 2026" },
  { value: "216,601", label: "Lines of JavaScript in the automation layer: the email engine, the chatbot, the scheduled jobs. Tests included.", note: "Counted November 7, 2026" },
  { value: "15,390", label: "Lines of Python in customer intelligence.", note: "Counted November 7, 2026" },
  { value: "182", label: "Database tables, every one behind row-level security.", note: "Counted November 3, 2026" },
  { value: "62", label: "Scheduled jobs running without me.", note: "Counted November 3, 2026" },
  { value: "83.0%", label: "Receipt reading accuracy on a local model, with zero invented values, on 48 test receipts.", note: "Eval of September 15, 2026" },
  { value: "88", label: "Scripted customer questions the chatbot is tested against. 76 passed on the last full run. None tripped a safety gate.", note: "Run of November 2, 2026" },
];
// Shown on /numbers/ only, so the BizPortal page's list stays about BizPortal and what runs beside it.
export const websiteCode = { value: "~57,500", label: "Lines of website code across our five public sites: Astro, TypeScript, JavaScript, and CSS.", note: "Counted November 7, 2026", href: "/work/websites/" };
export const writing = [
  { value: "4", label: "Essays on The Long Paddle. A fifth, on seven years sober, is on the way.", note: "November 7, 2026", href: "/writing/" },
  { value: "18", label: "Volumes of The Seed, the weekly letter from Vultun. Sixteen are mine.", note: "Vol. 18 sent November 2, 2026", href: "/writing/#the-seed" },
  { value: "96", label: "Subscribers to The Long Paddle. You could be 97.", note: "October 11, 2026", href: "https://jaysueno.substack.com/subscribe?utm_source=jaysueno.com&utm_medium=site&utm_campaign=numbers" },
  { value: "3,133", label: "Instagram followers on @jay_sueno. Another 2,071 on @feral.studio_ and 1,913 on @vultun_.", note: "Read November 7, 2026", href: "https://www.instagram.com/jay_sueno" },
];
export const stoppedRenting = {
  cancelled: [["Airtable", "our operations base", 6210], ["Zapier", "the automation glue", 3450], ["Kit", "the newsletter", 2300], ["Cursor", "a coding tool", 1259], ["CopyAI", "AI writing", 828]],
  replaced: [["DigitalOcean", "the server it runs on", 2875], ["Supabase", "the database we own", 2168], ["Resend", "the email rail", 1150], ["Our own email engine", "built in-house", 0]],
  note: "Monthly figures, converted at ₱57.5 to the dollar. SiteGround, our old web host, is also cancelled but prepaid through March 2027, so it is not counted here yet.",
};
