"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "motion/react";
import {
  Plus, ArrowUpRight, NotebookPen, Target, BarChart3, Wallet,
  Brain, Activity, Newspaper, ScanSearch,
} from "lucide-react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { getProfile } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

/** Every feature the product offers today, grouped exactly like the top nav.
 *  This is the curated overview — one card per destination, no widgets. */
const SECTIONS: {
  label: string;
  features: {
    href: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}[] = [
  {
    label: "Trading",
    features: [
      { href: "/journal", title: "Journal", description: "Log and review every trade with screenshots and notes.", icon: NotebookPen },
      { href: "/analysis", title: "Analysis", description: "Structured pre-trade plans across your timeframes.", icon: Target },
      { href: "/analytics", title: "Analytics", description: "Performance, edge and P&L broken down by every angle.", icon: BarChart3 },
      { href: "/accounts", title: "Accounts", description: "Track balances and risk across your trading accounts.", icon: Wallet },
    ],
  },
  {
    label: "MC Mindset formula",
    features: [
      { href: "/psychological-edge", title: "Psychological Edge", description: "Pre-market check-up and the 5R reflection engine.", icon: Brain },
    ],
  },
  {
    label: "MC Option Flow",
    features: [
      { href: "/option-flow", title: "Option Flow", description: "Follow institutional options positioning in real time.", icon: Activity },
    ],
  },
  {
    label: "MC News Dashboard",
    features: [
      { href: "/news-city", title: "MC News Dashboard", description: "The market's moving headlines, curated and ranked.", icon: Newspaper },
    ],
  },
];

const QUICK_ACTIONS = [
  { href: "/journal/new", title: "Log a trade", description: "Add a new entry to your journal", icon: Plus, primary: true },
  { href: "/analysis/new", title: "New analysis", description: "Plan your next setup", icon: ScanSearch, primary: false },
];

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    getProfile().then((p) => {
      if (p?.full_name) setFirstName(p.full_name.split(" ")[0]);
    });
  }, []);

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
        <h1 className="font-heading font-black text-3xl md:text-4xl text-foreground tracking-tight leading-[0.95]">
          {greeting ? `${greeting}${firstName ? `, ${firstName}` : ""}` : "Dashboard"}
        </h1>
        <p className="font-body text-sm font-light text-muted-foreground mt-3 leading-relaxed max-w-xl">
          Your complete workspace — jump straight into any part of the platform.
        </p>
      </motion.div>

      <PageWrapper className="space-y-10">
        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={cn(
                "group relative flex items-center gap-4 rounded-2xl px-5 py-5 transition-all hover:-translate-y-0.5",
                a.primary
                  ? "text-white"
                  : "border border-border bg-card hover:border-primary/40"
              )}
              style={a.primary ? {
                background: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)",
                boxShadow: "0 8px 30px rgba(20,184,166,0.28)",
              } : undefined}
            >
              <span className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                a.primary ? "bg-white/20" : "bg-primary/10 text-primary"
              )}>
                <a.icon className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-base font-bold leading-tight", !a.primary && "text-foreground")}>{a.title}</p>
                <p className={cn("text-sm mt-0.5", a.primary ? "text-white/80" : "text-muted-foreground")}>{a.description}</p>
              </div>
              <ArrowUpRight className={cn(
                "w-5 h-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                a.primary ? "text-white/80" : "text-muted-foreground"
              )} />
            </Link>
          ))}
        </div>

        {/* Feature sections */}
        {SECTIONS.map((section) => (
          <div key={section.label} className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary/80">
              {section.label}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.features.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <f.icon className="w-5 h-5" />
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <p className="text-base font-bold text-foreground leading-tight">{f.title}</p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </PageWrapper>
    </div>
  );
}
