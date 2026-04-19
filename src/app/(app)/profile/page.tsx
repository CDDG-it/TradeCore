"use client";

import { useState } from "react";
import { Camera, Mail, User, Calendar, Trophy, BarChart2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats, getTrades, getAccounts } from "@/lib/mock/store";

export default function ProfilePage() {
  const { user } = useAuth();
  const stats = getDashboardStats();
  const trades = getTrades();
  const accounts = getAccounts();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.full_name || "Demo Trader",
    email: user?.email || "demo@tradinghub.app",
    bio: "Futures and commodities trader focused on high-probability setups. Gold, ES, and crude oil specialist.",
    timezone: "America/New_York",
    tradingStyle: "Intraday",
  });

  const initials = form.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await new Promise((r) => setTimeout(r, 400));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const memberSince = user?.created_at
    ? format(new Date(user.created_at), "MMMM yyyy")
    : "January 2026";

  const bestTrade = [...trades].filter((t) => t.result === "win").sort((a, b) => b.rr - a.rr)[0];
  const totalPayouts = accounts.reduce((s, a) => s + a.payout_total, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader badge="Account" title="Profile" subtitle="Your trader profile" />
      <PageWrapper>
      {/* Avatar + name */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{initials}</span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold">{form.full_name}</p>
              <p className="text-sm text-muted-foreground">{form.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Member since {memberSince}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" />
                  {stats.total_trades} trades logged
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Trades", value: stats.total_trades.toString() },
          { label: "Win Rate", value: `${stats.win_rate}%` },
          { label: "Avg R:R", value: `${stats.average_rr}R` },
          { label: "Total Payouts", value: `$${totalPayouts.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border/50 rounded-xl p-4 text-center">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Best trade */}
      {bestTrade && (
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-success">Best Trade</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/80">
                {bestTrade.instrument} · {bestTrade.session}
              </span>
              <span className="font-bold text-success">+{bestTrade.rr}R</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(bestTrade.date_time.slice(0, 10) + "T12:00:00"), "MMMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit profile form */}
      <form onSubmit={handleSave}>
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs">Full Name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="h-9 text-sm bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="h-9 text-sm bg-background/50 pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                className="text-sm bg-background/50 min-h-20 resize-none"
                placeholder="Tell us about your trading style..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-xs">Timezone</Label>
                <Input
                  id="timezone"
                  value={form.timezone}
                  onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                  className="h-9 text-sm bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Trading Style</Label>
                <div className="flex gap-1.5">
                  {["Scalp", "Intraday", "Swing"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, tradingStyle: s }))}
                      className={
                        form.tradingStyle === s
                          ? "flex-1 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground"
                          : "flex-1 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-4">
          <Button type="submit" disabled={saved}>
            {saved ? "Saved!" : "Save profile"}
          </Button>
        </div>
      </form>
      </PageWrapper>
    </div>
  );
}
