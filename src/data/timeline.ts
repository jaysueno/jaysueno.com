// Marks on the water. Dates and words come from public pages or Jay's own posts.
// `when` is the date the mark sits on. `date` is how the page says it.
export const AGE_47_ANCHOR = "2026-10-01"; // he is 47 in October 2026 (captions of Oct 11 and Oct 12, 2026)

export const marks = [
  { when: "2009-06-01", date: "2009", text: "First trip to Siargao. Dirt runway." },
  { when: "2012-10-01", date: "About 2012", text: "Started surfing. I was 33." },
  { when: "2019-09-13", date: "September 13, 2019", text: "Last drink. A bench at my favorite surf break, Friday the 13th, Harvest Moon." },
  { when: "2020-06-15", date: "2020", text: "Ten days of silence at a Vipassana. Almost 200 surf sessions that year." },
  { when: "2020-11-15", date: "November 2020", text: "Data science certificate from UC San Diego. I went back to school at 40." },
  { when: "2021-03-15", date: "March 2021", text: "Data analyst at Amazon." },
  { when: "2021-09-01", date: "Late summer 2021", text: "My first Burning Man. A Renegade burn, the year the official one was cancelled." },
  { when: "2022-07-01", date: "Summer 2022", text: "Came back to Siargao." },
  { when: "2023-10-18", date: "October 18, 2023", text: "Vultun, Inc. incorporated. The spa and surf home at Jacking Horse opened that year." },
  { when: "2024-11-01", date: "Late 2024", text: "My daughter. A father at 45." },
  { when: "2025-06-01", date: "2025", text: "Feral Pilates opened." },
  { when: "2026-05-23", date: "May 23, 2026", text: "BizPortal went live, the software that runs the company. Directed by me, written mostly by AI agents." },
  { when: "2026-09-05", date: "September 5, 2026", text: "Physician-led IV therapy and aesthetics opened at Malinao." },
];

export const YEARS = 100;
export const WEEKS = 52;
const WEEK = 7 * 86400000;
const anchor = Date.parse(`${AGE_47_ANCHOR}T00:00:00+08:00`);

/** Weeks of life at a date, counted from the October 2026 anchor at 47 years. */
export function weekIndex(iso: string) {
  const t = Date.parse(`${iso}T00:00:00+08:00`);
  return Math.round(47 * WEEKS + (t - anchor) / WEEK);
}
export const FIRST_DRINK_YEAR_AGE = 15; // "8-12 drinks a day" for "25 years" before September 2019 (creation story)
export function nowWeek(on = new Date()) {
  return Math.round(47 * WEEKS + (on.getTime() - anchor) / WEEK);
}
