// The one set of facts every page, schema block, and agent file reads from.
// Every value traces to a public page or to Jay's own words.
export const SITE = "https://jaysueno.com";
export const PERSON_ID = `${SITE}/#person`;
export const WEBSITE_ID = `${SITE}/#website`;
export const VULTUN_ORG_ID = "https://vultun.com/#organization";

export const LAST_DRINK = "2019-09-13";
export const EDITION = { number: 1, date: "2026-11-07", label: "November 7, 2026" };

export const identity = {
  name: "Jay Sueno",
  line: "Most of a good life is the paddle.",
  place: "General Luna, Siargao, Philippines",
  shortBio:
    "Jay Sueno is the founder and CEO of Vultun, a wellness group of ten business units on Siargao, a surf island in the southern Philippines. He writes The Long Paddle. He is forty-seven, seven years sober, and a father.",
  // Set PUBLIC_CONTACT_EMAIL when you build (see README). The fallback is a documentation address.
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || "hello@example.com",
  substack: "https://jaysueno.substack.com",
};

export const links = [
  { label: "Instagram", handle: "@jay_sueno", url: "https://www.instagram.com/jay_sueno" },
  { label: "X", handle: "@therealjaysueno", url: "https://x.com/therealjaysueno" },
  { label: "Substack", handle: "The Long Paddle", url: "https://jaysueno.substack.com" },
  { label: "LinkedIn", handle: "in/jaysueno", url: "https://www.linkedin.com/in/jaysueno" },
  { label: "GitHub", handle: "jaysueno", url: "https://github.com/jaysueno" },
  { label: "TikTok", handle: "@jay_sueno", url: "https://www.tiktok.com/@jay_sueno" },
  { label: "Threads", handle: "@jay_sueno", url: "https://www.threads.com/@jay_sueno" },
];

export const nav = [
  { label: "Story", href: "/about/" },
  { label: "Work", href: "/work/" },
  { label: "Writing", href: "/writing/" },
  { label: "Field notes", href: "/field-notes/" },
  { label: "Numbers", href: "/numbers/" },
  { label: "Code", href: "/code/" },
];

export const footerNav = [
  { label: "Now", href: "/now/" },
  { label: "Shelf", href: "/shelf/" },
  { label: "Resume", href: "/resume/" },
  { label: "Heard and seen", href: "/press/" },
  { label: "Who I want to meet", href: "/open-to/" },
  { label: "Work with me", href: "/work-with-me/" },
  { label: "For agents", href: "/agents/" },
  { label: "Colophon", href: "/colophon/" },
  { label: "RSS", href: "/rss.xml" },
];

export function daysSober(on = new Date()) {
  const start = Date.parse(`${LAST_DRINK}T00:00:00+08:00`);
  return Math.floor((on.getTime() - start) / 86400000);
}

export const personNode = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: identity.name,
  url: `${SITE}/`,
  image: `${SITE}/og-image.jpg`,
  jobTitle: "Founder and CEO of Vultun",
  description: identity.shortBio,
  worksFor: [
    { "@type": "Organization", "@id": VULTUN_ORG_ID, name: "Vultun", url: "https://vultun.com" },
  ],
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "University of Washington", url: "https://www.washington.edu" },
    { "@type": "CollegeOrUniversity", name: "University of California, San Diego", url: "https://ucsd.edu" },
  ],
  homeLocation: { "@type": "Place", name: "General Luna, Siargao, Philippines" },
  knowsLanguage: ["English", "Tagalog", "Spanish"],
  knowsAbout: [
    "Wellness business operations",
    "Running a business with AI coding agents",
    "Data analysis",
    "Sobriety",
    "Surfing",
    "Building a business in the Philippines",
    "Personal essays",
  ],
  sameAs: links.map((l) => l.url),
};
