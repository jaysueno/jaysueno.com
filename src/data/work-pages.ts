// Long form for each /work/ page.
export const utm = (url: string, campaign: string) => `${url}${url.includes("?") ? "&" : "?"}utm_source=jaysueno.com&utm_medium=site&utm_campaign=${campaign}`;
