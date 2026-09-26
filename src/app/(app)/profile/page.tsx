"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera, Mail, User, Calendar, CheckCircle2, AlertCircle, Loader2, Trash2, Upload,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
import { deleteAvatar, uploadAvatar } from "@/lib/supabase/storage";

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
  const { user, avatarUrl: signedAvatar } = useAuth();
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  /* What is stored on the account: a storage path. `signedAvatar` is what the
     browser can actually load, signed centrally in the auth context. */
  const [storedAvatar, setStoredAvatar] = useState<string | undefined>(
    () => user?.user_metadata?.avatar_url
  );
  const [uploadedPreview, setUploadedPreview] = useState<string | undefined>();
  // The freshly signed link wins right after an upload; otherwise the context's.
  const avatarUrl = uploadedPreview ?? signedAvatar ?? undefined;
  const [avatarState, setAvatarState] = useState<"idle" | "uploading" | "removing" | "error">("idle");
  const [avatarError, setAvatarError] = useState("");

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

  async function handleAvatar(file?: File) {
    if (!file || !user) return;
    setAvatarError("");
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setAvatarError("Choose a JPG, PNG or WebP image smaller than 5 MB.");
      setAvatarState("error");
      return;
    }
    setAvatarState("uploading");
    try {
      const path = await uploadAvatar(user.id, file);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: path } });
      if (error) throw error;
      setStoredAvatar(path);
      // Show it at once from the local file rather than waiting for the signed
      // link to come back; the context replaces it a moment later.
      setUploadedPreview(URL.createObjectURL(file));
      setAvatarState("idle");
    } catch {
      setAvatarError("Profile photo could not be uploaded. Run the avatar migration if needed.");
      setAvatarState("error");
    }
  }

  async function handleRemoveAvatar() {
    if (!user || !storedAvatar) return;
    setAvatarState("removing");
    setAvatarError("");
    try {
      await deleteAvatar(user.id, storedAvatar);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
      if (error) throw error;
      setStoredAvatar(undefined);
      setUploadedPreview(undefined);
      setAvatarState("idle");
    } catch {
      setAvatarError("Profile photo could not be removed.");
      setAvatarState("error");
    }
  }

  const memberSince = user?.created_at
    ? format(new Date(user.created_at), "MMMM yyyy")
    : "-";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader badge="Account" title="Profile" subtitle="Your trader profile" />
      <PageWrapper className="grid items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:space-y-0">
        {/* Avatar + name */}
        <Card className="overflow-hidden border-border/50 bg-card lg:sticky lg:top-20">
          <div className="h-20 bg-[radial-gradient(circle_at_25%_0%,color-mix(in_oklch,var(--primary)_35%,transparent),transparent_72%)]" />
          <CardContent className="-mt-10 p-6 pt-0">
            <div className="relative h-24 w-24">
              <div className="h-full w-full rounded-3xl border-4 border-card bg-primary/15 bg-cover bg-center shadow-xl" style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined }}>
                {!avatarUrl && <span className="flex h-full items-center justify-center text-2xl font-bold text-primary">{initials}</span>}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Upload profile photo" disabled={avatarState === "uploading"} className="press absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-lg hover:border-primary/40 hover:text-primary disabled:opacity-60">
                {avatarState === "uploading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void handleAvatar(event.target.files?.[0]); event.currentTarget.value = ""; }} />
            </div>
            <p className="mt-4 truncate text-xl font-bold">{form.full_name}</p>
            <p className="truncate text-sm text-muted-foreground">{form.email}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />Member since {memberSince}</p>
            <div className="mt-6 space-y-2 border-t border-border/50 pt-5">
              <Button type="button" variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()} disabled={avatarState === "uploading"}><Upload className="h-4 w-4" />{avatarUrl ? "Replace photo" : "Upload photo"}</Button>
              {avatarUrl && <Button type="button" variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleRemoveAvatar} disabled={avatarState === "removing"}>{avatarState === "removing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Remove photo</Button>}
            </div>
            {avatarError && <p className="mt-3 text-xs leading-relaxed text-destructive">{avatarError}</p>}
          </CardContent>
        </Card>

        {/* Edit profile form */}
        {profileLoading ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border/50 bg-card">
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
                    placeholder="Tell us about your trading style, experience, or goals..."
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
                        <SelectValue placeholder="Select session..." />
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
                      <SelectValue placeholder="Select instrument..." />
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
            <AnimatePresence mode="wait">
            {saveError && (
              <motion.div key="error" initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .16 }} className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {saveError}
              </motion.div>
            )}
            {saveState === "saved" && (
              <motion.div key="saved" initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .16 }} className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Profile saved successfully.
              </motion.div>
            )}
            </AnimatePresence>

            <div className="flex justify-end">
              <Button type="submit" disabled={saveState === "loading" || saveState === "saved"}>
                {saveState === "loading" ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving...</>
                ) : saveState === "saved" ? "Saved!" : "Save profile"}
              </Button>
            </div>
          </form>
        )}
      </PageWrapper>
    </div>
  );
}
