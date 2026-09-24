"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          setError("An account with this email already exists. Try signing in.");
        } else {
          setError(error.message);
        }
        return;
      }
      setSuccess(true);
    } catch {
      setError("Could not create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setResendSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (!error) setResendSuccess(true);
    } finally {
      setIsResending(false);
    }
  }

  if (success) {
    return (
      <AuthShell>
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-8 text-center"><span className="marketing-eyebrow">You&apos;re on the list</span><h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">Check your email.</h1><p className="mt-3 text-sm leading-relaxed text-[#aac2c7]">We sent a confirmation link to <strong className="text-white">{email}</strong>. Confirm it to activate your early-access account.</p></div>
          <Card className="border-white/10 bg-[#0d1c29]/90 text-white shadow-[0_30px_80px_rgba(0,0,0,.4)]"><CardContent className="space-y-4 p-6 sm:p-8"><p className="text-sm leading-relaxed text-[#aac2c7]">Check your spam folder if it doesn&apos;t arrive within a few minutes.</p>{resendSuccess ? <div className="rounded-xl bg-[#14b8a6]/10 px-4 py-3 text-sm text-[#8de0d5]">A new verification email has been sent.</div> : <Button variant="outline" className="h-12 w-full border-white/20 bg-transparent text-white hover:bg-white/5" onClick={handleResend} disabled={isResending}>{isResending ? "Sending..." : "Resend verification email"}</Button>}<Link href="/login" className="flex h-12 items-center justify-center rounded-xl text-sm font-semibold text-[#8de0d5] hover:bg-white/5">Back to sign in</Link></CardContent></Card>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="grid w-full max-w-5xl gap-12 lg:grid-cols-[1fr_430px] lg:items-center">
        <section className="hidden lg:block"><span className="marketing-eyebrow">TradingMC early access</span><h1 className="mt-6 max-w-xl text-6xl font-semibold leading-[.96] tracking-[-.06em] text-white">Build the process behind your best trades.</h1><p className="mt-7 max-w-lg text-base leading-[1.75] text-[#b8ccd0]">Join the early-access list and get the full TradingMC workspace while we build it with serious traders.</p><div className="mt-10 grid gap-4 sm:grid-cols-3">{[{ icon: Target, title: "Plan", body: "Turn your edge into a repeatable session." }, { icon: Check, title: "Execute", body: "Track the habits that keep you on plan." }, { icon: Eye, title: "Review", body: "See the decisions behind the result." }].map(({ icon: Icon, title, body }) => <div key={title} className="border-l border-[#14b8a6]/50 pl-4"><Icon className="size-4 text-[#7be0d5]" /><p className="mt-3 text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs leading-relaxed text-[#8faab0]">{body}</p></div>)}</div></section>
        <section>
          <div className="mb-7 lg:hidden"><span className="marketing-eyebrow">TradingMC early access</span><h1 className="mt-4 text-4xl font-semibold leading-none tracking-[-.05em] text-white">Build your edge with intention.</h1></div>
          <Card className="border-white/10 bg-[#0d1c29]/90 text-white shadow-[0_30px_80px_rgba(0,0,0,.45)]"><CardHeader className="space-y-2 p-6 pb-4 sm:p-8 sm:pb-4"><CardTitle className="text-2xl">Join the early-access list</CardTitle><CardDescription className="text-[#9db6bb]">Full access while we build. No card, no trial clock.</CardDescription></CardHeader><CardContent className="p-6 pt-2 sm:p-8 sm:pt-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#d4e3e5]">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className="border-white/10 bg-white/[.04] text-white placeholder:text-[#718b92]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#d4e3e5]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-white/10 bg-white/[.04] text-white placeholder:text-[#718b92]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#d4e3e5]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="border-white/10 bg-white/[.04] text-white placeholder:text-[#718b92]"
                />
                <p className="text-xs text-[#7f9aa1]">Minimum 8 characters</p>
              </div>

              <Button type="submit" className="h-12 w-full bg-[#14b8a6] font-semibold text-[#081721] hover:bg-[#70d9cf]" disabled={isLoading}>
                {isLoading ? "Joining..." : "Join early access"}<ArrowRight className="ml-2 size-4" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By joining you agree to our{" "}
                <Link href="/terms" className="text-[#8de0d5] underline underline-offset-4">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-[#8de0d5] underline underline-offset-4">Privacy Policy</Link>.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}<Link href="/login" className="text-[#8de0d5] hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
          <p className="mt-5 text-center text-xs text-[#718b92]">Your feedback helps shape what TradingMC becomes next.</p>
        </section>
      </div>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return <main className="relative flex min-h-screen items-center overflow-hidden bg-[#0b1120] px-5 py-12 text-white sm:px-8"><div aria-hidden className="marketing-grid pointer-events-none absolute inset-0 opacity-30" /><div className="relative mx-auto w-full max-w-6xl"><Link href="/" className="mb-12 inline-block text-xl font-semibold tracking-[-.05em] text-white">Trading<span className="text-[#65d4c8]">MC</span></Link>{children}</div></main>;
}
