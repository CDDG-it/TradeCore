// Shared constants for the funded accounts feature

export const PROP_FIRMS = [
  // Most popular
  "Topstep",
  "Apex Trader Funding",
  "Bulenox",
  "TradeDay",
  "My Funded Futures",
  "Earn2Trade",
  "Take Profit Trader",
  "Leeloo Trading",
  "OneUp Trader",
  // Others
  "BluSky Trading",
  "The Trading Pit",
  "Funded Trading Plus",
  "Breakout Funding",
  "Uprofit",
  "FTMO",
  "Tradeify",
  "Helios Trading",
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

export const ACCOUNT_TYPES = [
  "Pro",
  "Flex",
  "Standard",
  "Express",
  "Evaluation",
  "Instant Funded",
  "Static",
] as const;

export type AccountTypeName = (typeof ACCOUNT_TYPES)[number];
