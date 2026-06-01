"use client";

import { useState, useEffect } from "react";
import {
  Camera, Mail, User, Calendar, Trophy, BarChart2,
  Plus, Trash2, Pencil, Check, X, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import {
  getDashboardStats, getTrades, getAccounts,
  getProfile, upsertProfile,
  getHabits, createHabit, deleteHabit, updateHabit,
} from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import type { Habit } from "@/lib/types";

const SESSIONS = ["London", "New York", "Asia", "London + New York overlap", "Other"] as const;
const INSTRUMENTS = ["NQ", "ES", "XAUUSD", "EURUSD", "GBPUSD", "BTC", "CL", "Other"] as const;
const TIMEZONES = [
  "Europe/Amsterdam",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
] as const;

export default function ProfilePage() {
  const { user } = useAuth();

  const [stats, setStats] = useState<import("@/lib/types").DashboardStats | null>(null);
  const [trades, setTrades] = useState<import("@/lib/types").TradeJournalEntry[]>([]);
  const [accounts, setAccounts] = useState<import("@/lib/types").FundedAccount[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  const [saveState, setSaveState] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Trader";

  const [form, setForm] = useState({
    full_name: displayName,
    email: user?.email || "",
    bio: "",
    timezone: "Europe/Amsterdam",
    preferred_session: "",
    preferred_instrument: "",
    discipline_rules: "",
  });

  useEffect(() => {
    Promise.all([
      getDashboardStats().then(setStats),
      getTrades().then(setTrades),
      getAccounts().then(setAccounts),
      getHabits().then(setHabits),
      getProfile().then((p) => {
        if (p) {
          setForm((prev) => ({
            ...prev,
            full_name: p.full_name || prev.full_name,
            bio: p.bio || "",
            timezone: p.timezone || "Europe/Amsterdam",
            preferred_session: p.preferred_session || "",
            preferred_instrument: p.preferred_instrument || "",
            discipline_rules: p.discipline_rules || "",
          }));
        }
        setProfileLoading(false);
      }),
    ]);
  }, []);

  const initials = (form.full_name || "T")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveState("loading");
    try {
      const supabase = createClient();
      await Promise.all([
        supabase.auth.updateUser({ data: { full_name: form.full_name } }),
        upsertProfile({
          full_name: form.full_name,
          bio: form.bio,
          timezone: form.timezone,
          preferred_session: form.preferred_session,
          preferred_instrument: form.preferred_instrument,
          discipline_rules: form.discipline_rules,
        }),
      ]);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch {
      setSaveError("Failed to save profile. Please try again.");
      setSaveState("error");
    }
  }

  const memberSince = user?.created_at
    ? format(new Date(user.created_at), "MMMM yyyy")
    : "—";

  const safeStats = stats ?? {
    total_trades: 0, win_rate: 0, average_rr: 0,
    break_even_rate: 0, active_accounts: 0, total_payouts: 0, total_drawdown_used: 0,
  };

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
                    {safeStats.total_trades} trades logged
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Trades", value: safeStats.total_trades.toString() },
            { label: "Win Rate", value: `${safeStats.win_rate}%` },
            { label: "Avg R:R", value: `${safeStats.average_rr}R` },
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
        {profileLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Personal information */}
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
                        disabled
                        className="h-9 text-sm bg-background/50 pl-9 opacity-60 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-xs">
                    Short Bio
                    <span className="text-muted-foreground ml-1">({form.bio.length}/280)</span>
                  </Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value.slice(0, 280) }))}
                    className="text-sm bg-background/50 min-h-20 resize-none"
                    placeholder="Tell us about your trading style, experience, or goals…"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Timezone</Label>
                    <Select
                      value={form.timezone}
                      onValueChange={(v) => setForm((p) => ({ ...p, timezone: v ?? p.timezone }))}
                    >
                      <SelectTrigger className="h-9 text-sm bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Preferred Trading Session</Label>
                    <Select
                      value={form.preferred_session}
                      onValueChange={(v) => setForm((p) => ({ ...p, preferred_session: v ?? p.preferred_session }))}
                    >
                      <SelectTrigger className="h-9 text-sm bg-background/50">
                        <SelectValue placeholder="Select session…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SESSIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Preferred Instrument</Label>
                  <Select
                    value={form.preferred_instrument}
                    onValueChange={(v) => setForm((p) => ({ ...p, preferred_instrument: v ?? p.preferred_instrument }))}
                  >
                    <SelectTrigger className="h-9 text-sm bg-background/50">
                      <SelectValue placeholder="Select instrument…" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTRUMENTS.map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Discipline rules */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Discipline Rules</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your personal pre-trade discipline checklist. These rules will appear in the journal when logging trades.
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.discipline_rules}
                  onChange={(e) => setForm((p) => ({ ...p, discipline_rules: e.target.value }))}
                  className="text-sm bg-background/50 min-h-32 resize-none font-mono"
                  placeholder={"1. Only trade during my preferred session\n2. Wait for confirmation before entry\n3. Never risk more than 1% per trade\n4. No revenge trading after a loss"}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  One rule per line. These are referenced in the journal&apos;s pre-trade checklist.
                </p>
              </CardContent>
            </Card>

            {/* Habits */}
            <HabitsEditor habits={habits} setHabits={setHabits} />

            {/* Save feedback */}
            {saveError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {saveError}
              </div>
            )}
            {saveState === "saved" && (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Profile saved successfully.
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saveState === "loading" || saveState === "saved"}>
                {saveState === "loading" ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</>
                ) : saveState === "saved" ? "Saved!" : "Save profile"}
              </Button>
            </div>
          </form>
        )}
      </PageWrapper>
    </div>
  );
}

// ── Habits editor ─────────────────────────────────────────────────────

function HabitsEditor({
  habits,
  setHabits,
}: {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const habit = await createHabit({
        name: newName.trim(),
        icon: "🎯",
        category: "routine",
        frequency: "daily",
        target_days: 7,
        color: "oklch(0.72 0.22 45)",
      });
      setHabits((prev) => [...prev, habit]);
      setNewName("");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  async function handleRename(id: string) {
    if (!editName.trim()) { setEditingId(null); return; }
    const updated = await updateHabit(id, { name: editName.trim() });
    setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    setEditingId(null);
  }

  function startEdit(h: Habit) {
    setEditingId(h.id);
    setEditName(h.name);
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Daily Habits</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          These habits appear in your dashboard and habit tracker. Changes here are reflected everywhere.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {habits.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">No habits yet. Add your first one below.</p>
        )}
        <div className="space-y-1.5">
          {habits.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 group"
            >
              <span className="text-base shrink-0">{h.icon}</span>
              {editingId === h.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-sm bg-background/50 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(h.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleRename(h.id)}
                    className="text-success hover:text-success/80 transition-colors shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm flex-1 truncate">{h.name}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(h)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(h.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new habit */}
        <div className="flex gap-2 pt-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a habit…"
            className="h-8 text-sm bg-background/50 flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="h-8 px-3"
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
