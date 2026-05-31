// Shared constants for the funded accounts feature

export const PROP_FIRMS = [
  // Most popular first
  "Topstep",
  "Apex Trader Funding",
  "MyFundedFutures / MFFU",
  "Alpha Futures",
  "Lucid Trading",
  "Take Profit Trader",
  "Tradeify",
  "Earn2Trade",
  "Bulenox",
  "UProfit Trader",
  "Elite Trader Funding",
  "OneUp Trader",
  "FundedNext Futures",
] as const;

export type PropFirm = (typeof PROP_FIRMS)[number];

export const ACCOUNT_SIZE_PRESETS = [
  { label: "25K", value: 25000 },
  { label: "50K", value: 50000 },
  { label: "75K", value: 75000 },
  { label: "100K", value: 100000 },
  { label: "150K", value: 150000 },
  { label: "200K", value: 200000 },
  { label: "250K", value: 250000 },
  { label: "300K", value: 300000 },
] as const;
