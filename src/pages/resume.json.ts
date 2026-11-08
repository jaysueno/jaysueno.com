// JSON Resume (jsonresume.org), the open format agents and tools can read.
import { roles, education, languages, skills } from "../data/resume";
import { identity, links, SITE } from "../data/identity";
export const GET = () =>
  new Response(
    JSON.stringify(
      {
        $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
        basics: {
          name: identity.name,
          label: "Founder and CEO of Vultun",
          email: identity.email,
          url: `${SITE}/`,
          summary: identity.shortBio,
          location: { city: "General Luna", region: "Siargao", countryCode: "PH" },
          profiles: links.map((l) => ({ network: l.label, username: l.handle, url: l.url })),
        },
        work: roles.map((r) => ({ name: r.org, position: r.title, location: r.place, startDate: r.start, ...(r.end ? { endDate: r.end } : {}), highlights: r.points })),
        education: education.map((e) => ({ institution: e.school, studyType: e.what, ...(e.start ? { startDate: e.start } : {}), ...(e.end ? { endDate: e.end } : {}) })),
        skills: skills.map((name) => ({ name })),
        languages: languages.map((language) => ({ language })),
        meta: { canonical: `${SITE}/resume.json`, lastModified: "2026-11-07" },
      },
      null,
      2,
    ),
    { headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
