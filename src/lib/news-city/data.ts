import type { NewsCityData } from "./types";

/**
 * Mock content for MC News City. Shape mirrors what a future news /
 * economic-calendar / AI-summary integration would return, so swapping this
 * for a live fetch later is a data-layer change only.
 */
export const NEWS_CITY_DATA: NewsCityData = {
  overview: {
    riskLevel: "moderate",
    mainDriver: "Fed rate-path repricing after sticky core CPI",
    latestEvent: "Core CPI printed 3.1% YoY, above the 2.9% consensus",
    sentiment: "risk-on",
  },
  centralBanks: [
    {
      id: "fed",
      name: "Federal Reserve",
      shortName: "Fed",
      headline: "Fed holds rates, signals one cut still on the table for Q4",
      rate: "4.25% - 4.50%",
      rateExpectation: "1 cut priced in by December",
      direction: "hawkish",
      impact: "Pressures NQ/ES higher-for-longer discount rate; growth names most sensitive.",
      lastUpdated: "2h ago",
    },
    {
      id: "ecb",
      name: "European Central Bank",
      shortName: "ECB",
      headline: "ECB trims deposit rate 25bps, cites cooling euro-area inflation",
      rate: "2.75%",
      rateExpectation: "Gradual easing path into 2027",
      direction: "dovish",
      impact: "Weaker EUR supports USD strength; modest tailwind for US dollar-denominated futures.",
      lastUpdated: "5h ago",
    },
    {
      id: "boj",
      name: "Bank of Japan",
      shortName: "BoJ",
      headline: "BoJ keeps policy rate unchanged, watching yen weakness closely",
      rate: "0.50%",
      rateExpectation: "Next hike unlikely before Q1",
      direction: "neutral",
      impact: "Carry-trade unwind risk remains a tail risk for equity volatility.",
      lastUpdated: "1d ago",
    },
  ],
  commodities: [
    {
      id: "oil",
      name: "Crude Oil (WTI)",
      price: "$74.20",
      change: "+1.8%",
      direction: "rising",
      supplyRisk: "medium",
      geopoliticalImpact: "OPEC+ supply discipline holding; Middle East shipping risk keeping a floor under price.",
      headline: "OPEC+ reaffirms output quotas, oil extends weekly gain",
    },
    {
      id: "gold",
      name: "Gold",
      price: "$2,614",
      change: "+0.6%",
      direction: "rising",
      supplyRisk: "low",
      geopoliticalImpact: "Central bank buying and safe-haven demand offsetting real-yield headwinds.",
      headline: "Gold grinds higher as central banks keep stacking reserves",
    },
  ],
  macroForces: [
    {
      id: "inflation",
      name: "Inflation",
      headline: "Core CPI 3.1%, hotter than expected on shelter and services",
      metric: "3.1%",
      metricLabel: "Core CPI YoY",
      direction: "rising",
      impact: "Keeps pressure on the Fed to stay patient; headwind for rate-sensitive growth names.",
    },
    {
      id: "employment",
      name: "Employment",
      headline: "Payrolls add 142k, unemployment steady at 4.1%",
      metric: "4.1%",
      metricLabel: "Unemployment rate",
      direction: "flat",
      impact: "Labor market cooling gradually, not breaking — supports a soft-landing narrative.",
    },
    {
      id: "growth",
      name: "Growth",
      headline: "Q3 GDP revised up to 2.8% on resilient consumer spending",
      metric: "2.8%",
      metricLabel: "GDP growth (QoQ ann.)",
      direction: "rising",
      impact: "Solid growth backdrop supports earnings, but complicates the case for near-term cuts.",
    },
  ],
  marketHQ: {
    sentiment: "risk-on",
    regime: "Risk-On",
    drivers: ["AI capex optimism", "Earnings strength", "Lower long-end yields"],
    indices: [
      { id: "nq", name: "Nasdaq 100 Futures", ticker: "NQ", price: "22,450.25", change: "+0.74%", direction: "rising" },
      { id: "es", name: "S&P 500 Futures", ticker: "ES", price: "6,812.50", change: "+0.41%", direction: "rising" },
    ],
  },
};
