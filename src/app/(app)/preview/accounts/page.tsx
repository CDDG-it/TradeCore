"use client";

import { useCallback } from "react";
import { notFound } from "next/navigation";
import { LiveBrokerPanel } from "@/components/accounts/live-broker-panel";
import { sampleBrokerData, sampleHistory } from "@/lib/broker/sample";

/**
 * Development only: the Live accounts panel with sample brokers, so the
 * populated states can be seen without connecting a real Tradovate login.
 * The middleware lets `/preview/*` through outside production; this guard
 * makes it a 404 there regardless.
 */
export default function PreviewAccountsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const load = useCallback(async () => sampleBrokerData(), []);
  const loadHistory = useCallback(async (id: string, from: string, to: string) => sampleHistory(id, from, to), []);
  return (
    <div className="p-6">
      <LiveBrokerPanel hidden={false} load={load} loadHistory={loadHistory} />
    </div>
  );
}
