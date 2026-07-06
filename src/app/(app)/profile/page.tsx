"use client";

import { useState, useEffect } from "react";
import {
  Camera, Mail, User, Calendar, CheckCircle2, AlertCircle, Loader2,
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
import { getProfile, upsertProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";

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
  });

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        // Prefer values the user may have already typed during the async load
        // (prev.* wins) so a slow profile fetch can't clobber in-progress input.
        setForm((prev) => ({
          ...prev,
          full_name: prev.full_name || p.full_name || "",
          bio: prev.bio || p.bio || "",
          timezone: prev.timezone !== "Europe/Amsterdam" ? prev.timezone : (p.timezone || "Europe/Amsterdam"),
          preferred_session: prev.preferred_session || p.preferred_session || "",
          preferred_instrument: prev.preferred_instrument || p.preferred_instrument || "",
        }));
      }
      setProfileLoading(false);
    });
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
        // Only the personal profile fields are managed here. Trading rules and
        // confluences moved to the Habits and Journal pages respectively.
        upsertProfile({
          full_name: form.full_name,
          bio: form.bio,
          timezone: form.timezone,
          preferred_session: form.preferred_session,
          preferred_instrument: form.preferred_instrument,
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
