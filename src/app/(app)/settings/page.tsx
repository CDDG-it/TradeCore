"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, BarChart2, Palette, Sun, Moon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getProfile, upsertProfile } from "@/lib/supabase/queries";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

const PREFERRED_INSTRUMENTS = ["NQ", "ES", "Gold"] as const;

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [pwState, setPwState] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState("");
  const [prefInstrument, setPrefInstrument] = useState<string | null>(null);
  const [prefSaveState, setPrefSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    getProfile().then((p) => {
      if (p?.preferred_instrument) setPrefInstrument(p.preferred_instrument);
    });
  }, []);

  async function handleSaveInstrument(instrument: string) {
    setPrefInstrument(instrument);
    setPrefSaveState("saving");
    try {
      await upsertProfile({ preferred_instrument: instrument });
      setPrefSaveState("saved");
      setTimeout(() => setPrefSaveState("idle"), 2000);
    } catch {
      setPrefSaveState("idle");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwState("loading");
    try {
      const supabase = createClient();
      // Re-authenticate then update password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email ?? "",
        password: pwForm.current,
      });
      if (signInErr) {
        setPwError("Current password is incorrect.");
        setPwState("error");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) throw error;
      setPwState("saved");
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwState("idle"), 3000);
    } catch {
      setPwError("Failed to update password. Please try again.");
      setPwState("error");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader badge="Account" title="Settings" subtitle="Security and account configuration" />
      <PageWrapper>
        {/* Appearance */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-xs mb-2 block">Theme</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => theme !== "dark" && toggleTheme()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                  theme === "dark"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
              <button
                type="button"
                onClick={() => theme !== "light" && toggleTheme()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                  theme === "light"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Trading Preferences */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Trading Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs mb-2 block">Preferred Instrument</Label>
              <div className="flex gap-2">
                {PREFERRED_INSTRUMENTS.map((inst) => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => handleSaveInstrument(inst)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-semibold font-mono transition-all",
                      prefInstrument === inst
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                  >
                    {inst}
                  </button>
                ))}
              </div>
              {prefSaveState === "saved" && (
                <div className="flex items-center gap-1.5 text-xs text-success mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Preference saved
                </div>
              )}
              {prefSaveState === "saving" && (
                <p className="text-xs text-muted-foreground mt-2">Saving…</p>
              )}
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
          <CardContent className="space-y-6">
            {/* Change password */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">Change Password</p>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="current_pw" className="text-xs">Current password</Label>
                  <div className="relative">
                    <Input
                      id="current_pw"
                      type={showCurrent ? "text" : "password"}
                      value={pwForm.current}
                      onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                      className="h-9 text-sm bg-background/50 pr-9"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new_pw" className="text-xs">New password</Label>
                    <div className="relative">
                      <Input
                        id="new_pw"
                        type={showNext ? "text" : "password"}
                        value={pwForm.next}
                        onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                        className="h-9 text-sm bg-background/50 pr-9"
                        placeholder="Min. 8 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNext((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNext ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_pw" className="text-xs">Confirm new password</Label>
                    <Input
                      id="confirm_pw"
                      type="password"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                      className="h-9 text-sm bg-background/50"
                      placeholder="Repeat new password"
                      required
                    />
                  </div>
                </div>

                {pwError && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {pwError}
                  </div>
                )}

                {pwState === "saved" && (
                  <div className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Password updated successfully.
                  </div>
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={pwState === "loading" || pwState === "saved"}
                  className="mt-1"
                >
                  {pwState === "loading" ? "Updating…" : pwState === "saved" ? "Updated!" : "Update password"}
                </Button>
              </form>
            </div>

            <div className="border-t border-border/40" />

            {/* 2FA — coming soon */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                TOTP-based two-factor authentication (via authenticator app) is planned for a future release. No configuration is available yet — enabling a non-functional toggle would be misleading, so this section will unlock once the feature is fully implemented.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    </div>
  );
}
