export const siteConfig = {
  name: "Jay Sueno",
  domain: "jaysueno.com",
  tagline: "Most of a good life is the paddle.",
  description:
    "Jay Sueno is the founder of Vultun on Siargao. Forty-seven, seven years sober, a father, and the writer of The Long Paddle.",
  locale: "en-PH",
  newsletterName: "The Long Paddle",

  // Newsletter lives on Substack (free; handles subscribe + all sending).
  substackUrl: "https://jaysueno.substack.com",

  // Lead capture: the site's own Supabase project, separate from the businesses and from the
  // Siargao Water joint venture. Fill both values from your project (Settings, API). The anon key
  // is public by design (it ships in the client bundle); row-level security is the guard: anon
  // may INSERT a consented lead only and can never read. Schema + function live in supabase/.
  // Until both values are real, the form treats itself as unconfigured and sends nothing.
  supabase: {
    url: "https://YOUR-PROJECT.supabase.co" as string,
    anonKey: "YOUR-ANON-KEY" as string,
    leadsTable: "jaysueno_leads",
  },
};
