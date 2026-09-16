"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, LayoutDashboard, BookOpen, ChartNoAxesCombined, Brain } from "lucide-react";
import dashboard from "../../../public/screenshots/dashboard.png";
import journal from "../../../public/screenshots/journal.png";
import analytics from "../../../public/screenshots/analytics.png";
import habits from "../../../public/screenshots/habits.png";
import styles from "@/app/home.module.css";

const views = [
  { label: "Overview", icon: LayoutDashboard, image: dashboard, description: "Your trading day, in perspective.", alt: "TradingMC dashboard with account overview, win rate, discipline score and recent trades" },
  { label: "Trade journal", icon: BookOpen, image: journal, description: "Keep the context behind every decision.", alt: "TradingMC trade journal showing recorded trades and their results" },
  { label: "Analytics", icon: ChartNoAxesCombined, image: analytics, description: "Find the patterns behind your performance.", alt: "TradingMC analytics page with performance charts and trading statistics" },
  { label: "Habits", icon: Brain, image: habits, description: "Make discipline a daily practice.", alt: "TradingMC habits page for tracking routines and consistency" },
];

export function ScreenshotShowcase() {
  const [selected, setSelected] = useState(0);
  const view = views[selected];
  return (
    <div className={styles.showcase}>
      <div className={styles.viewButtons} role="group" aria-label="Choose a platform screenshot">
        {views.map((item, index) => <button key={item.label} type="button" aria-pressed={selected === index} aria-controls="platform-preview" onClick={() => setSelected(index)}><item.icon size={16} />{item.label}</button>)}
      </div>
      <figure id="platform-preview" className={styles.preview}>
        <div className={styles.previewBar}><span><i /> TradingMC workspace</span><span>Built around your process</span></div>
        <a href={view.image.src} target="_blank" rel="noopener noreferrer" aria-label={`View full-size ${view.label} screenshot (opens in a new tab)`}>
          <Image src={view.image} alt={view.alt} sizes="(max-width: 1200px) 94vw, 1120px" preload={selected === 0} />
        </a>
        <figcaption aria-live="polite"><span>{view.description}</span><a href={view.image.src} target="_blank" rel="noopener noreferrer">View screenshot <ArrowUpRight size={15} /><span className="sr-only"> (opens in a new tab)</span></a></figcaption>
      </figure>
    </div>
  );
}
