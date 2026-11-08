// The consulting offer. Approved by Jay on November 7, 2026 ("offer is goo", "yes dollars and
// vultun inc is fine", "any owner run business"). Source of truth for the numbers and the market
// evidence behind the values: the-long-paddle strategy/TLP-OFFER-2026-11.md. Change the offer
// there first, with Jay's word, then here.
export const OFFER_UPDATED = { iso: "2026-11-07", label: "November 7, 2026" };

export const audit = {
  name: "The AI Operations Audit",
  price: 1500,
  priceLater: 2500,
  foundingPlaces: 5,
  perMonth: 4,
  stack: [
    { what: "A ninety-minute working session on how your business actually runs.", value: 500 },
    { what: "The written plan: the five automations worth doing first, ranked by the hours and dollars they give back, each marked buy, build, or leave alone.", value: 2500 },
    { what: "A build plan for the first one, ready to hand to an AI agent or a developer.", value: 1000 },
    { what: "The cut list: the subscriptions you can cancel.", value: 500 },
    { what: "A recorded walkthrough of the plan.", value: 250 },
    { what: "Thirty days of questions by message.", value: 500 },
    { what: "Bonus: the rules I run my own AI agents by.", value: 500 },
  ],
};
export const stackTotal = audit.stack.reduce((sum, row) => sum + row.value, 0);
export const saving = stackTotal - audit.price;
export const savingPct = Math.round((saving / stackTotal) * 100);

export const above = [
  {
    name: "The 30-Day Build",
    price: 7500,
    unit: "",
    text: "One automation from your plan, built and running in your business in thirty days. If it isn't running by day thirty, I keep building at no charge until it is. The audit fee comes off the price if you start within thirty days. Two builds at a time.",
  },
  {
    name: "Operator on Call",
    price: 2500,
    unit: " a month",
    text: "Two calls a month, messages on weekdays, and a monthly review of your numbers and your agents' work. Five businesses at most.",
  },
];

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
