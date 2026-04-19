"use client";

import { useState } from "react";
import { Bell, Moon, Globe, Shield, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { isDemo } = useAuth();
  const [notifications, setNotifications] = useState({
    tradeReminders: true,
    newsAlerts: false,
    drawdownAlerts: true,
    payoutUpdates: true,
  });
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await new Promise((r) => setTimeout(r, 400));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader badge="Account" title="Settings" subtitle="Preferences and configuration" />
      <PageWrapper>
      {isDemo && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary">
          Demo mode active — settings are not persisted across sessions.
        </div>
      )}

      {/* Notifications */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: "tradeReminders" as const,
              label: "Daily trade reminders",
              desc: "Remind you to log trades at end of session",
            },
            {
              key: "newsAlerts" as const,
              label: "High-impact news alerts",
              desc: "Get notified for high-impact market events",
            },
            {
              key: "drawdownAlerts" as const,
              label: "Drawdown warnings",
              desc: "Alert when approaching drawdown threshold",
            },
            {
              key: "payoutUpdates" as const,
              label: "Payout status updates",
              desc: "Notifications for payout approvals and status changes",
            },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={notifications[key]}
                onCheckedChange={(v) =>
                  setNotifications((prev) => ({ ...prev, [key]: v }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Moon className="w-4 h-4 text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">App is optimized for dark mode</p>
            </div>
            <Switch checked={true} onCheckedChange={() => {}} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Compact layout</p>
              <p className="text-xs text-muted-foreground">Reduce spacing for more information density</p>
            </div>
            <Switch checked={false} onCheckedChange={() => {}} />
          </div>
        </CardContent>
      </Card>

      {/* Trading preferences */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Trading Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Default market</p>
              <p className="text-xs text-muted-foreground">Pre-select when creating trades or analysis</p>
            </div>
            <div className="flex gap-1">
              {["Futures", "Commodities"].map((m) => (
                <button
                  key={m}
                  className={
                    m === "Futures"
                      ? "px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground"
                      : "px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground"
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Default session</p>
              <p className="text-xs text-muted-foreground">Pre-select for new entries</p>
            </div>
            <div className="flex gap-1">
              {["London", "New York"].map((s) => (
                <button
                  key={s}
                  className={
                    s === "New York"
                      ? "px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground"
                      : "px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground"
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { label: "Change password", desc: "Update your account password" },
            { label: "Two-factor authentication", desc: "Add an extra layer of security" },
            { label: "Connected devices", desc: "View and manage active sessions" },
          ].map(({ label, desc }) => (
            <button
              key={label}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saved}>
          {saved ? "Saved!" : "Save preferences"}
        </Button>
      </div>
      </PageWrapper>
    </div>
  );
}
