"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { CandlesCanvas } from "@/components/landing/candles-canvas";
import { createClient } from "@/lib/supabase/client";

type PageState = "login" | "unverified" | "resent";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

const Logo = () => (
  <span className="font-black text-xl tracking-tight" style={{ fontFamily: NUNITO }}>
    <span style={{ color: "rgba(15,12,8,0.88)" }}>Trading</span>
    <span style={{ background: "linear-gradient(90deg,#14B8A6,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
  </span>
);

/* Full-screen warm-white backdrop with the drifting candlestick chart from the
   landing page, so signing in feels like part of the same product. */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-4" style={{ background: "oklch(0.98 0.003 45)" }}>
      <CandlesCanvas />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md space-y-8"
      >
        {children}
      </motion.div>
    </div>
  );
}

/* Glass card over the canvas — same treatment as the landing header */
function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-7"
      style={{
        background: "rgba(255,253,250,0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 16px 48px rgba(16,11,6,0.08)",
      }}
    >
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none " +
  "border-[rgba(16,11,6,0.12)] bg-[rgba(255,255,255,0.65)] text-[rgba(15,12,8,0.88)] " +
  "placeholder:text-[rgba(60,48,36,0.35)] " +
  "hover:border-[rgba(20,184,166,0.35)] " +
  "focus:border-[rgba(20,184,166,0.55)] focus:bg-white focus:ring-2 focus:ring-[rgba(20,184,166,0.15)]";

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      style={{
        fontFamily: NUNITO,
        background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)",
        boxShadow: "0 4px 20px rgba(20,184,166,0.30), 0 1px 3px rgba(0,0,0,0.10)",
      }}
    >
      {loading ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {children}
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold text-[rgba(60,48,36,0.60)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(20,184,166,0.45)] hover:text-[rgba(15,12,8,0.85)] active:translate-y-0"
      style={{ fontFamily: NUNITO, borderColor: "rgba(16,11,6,0.12)", background: "rgba(255,255,255,0.55)" }}
    >
      {children}
    </button>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(220,38,38,0.08)", color: "rgb(185,28,28)", border: "1px solid rgba(220,38,38,0.15)" }}>
      {children}
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [pageState, setPageState] = useState<PageState>("login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
          setPageState("unverified");
        } else if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
          setError("Invalid email or password.");
        } else {
          setError(error.message);
        }
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });

      if (!error) {
        setPageState("resent");
        return;
      }

      const msg = error.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("after") || msg.includes("seconds")) {
        setError("Please wait a moment before requesting another email.");
      } else if (msg.includes("already confirmed") || msg.includes("already registered")) {
        setError("This email is already verified. Try signing in.");
      } else {
        setError("Could not send verification email. Please try again in a few minutes.");
      }
    } catch {
      setError("Could not send verification email. Please try again in a few minutes.");
    } finally {
      setIsResending(false);
    }
  }

  const heading = (title: string, sub: React.ReactNode) => (
    <div className="mb-5 space-y-1">
      <h1 className="text-xl font-bold" style={{ fontFamily: NUNITO, color: "rgba(15,12,8,0.88)" }}>{title}</h1>
      <p className="text-sm" style={{ color: "rgba(60,48,36,0.55)" }}>{sub}</p>
    </div>
  );

  if (pageState === "unverified") {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-2"><Logo /></div>
        <AuthCard>
          {heading("Verify your email", <>Your account hasn&apos;t been verified yet. We need to confirm <strong>{email}</strong> before you can sign in.</>)}
          <div className="space-y-4">
            {error && <ErrorNote>{error}</ErrorNote>}
            <p className="text-sm" style={{ color: "rgba(60,48,36,0.55)" }}>
              Check your inbox for the original verification email, or request a new one below.
            </p>
            <SubmitButton loading={isResending}>
              {isResending ? "Sending" : "Resend verification email"}
            </SubmitButton>
            <SecondaryButton onClick={() => setPageState("login")}>Back to sign in</SecondaryButton>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  if (pageState === "resent") {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-2"><Logo /></div>
        <AuthCard>
          {heading("Email sent", <>A new verification link has been sent to <strong>{email}</strong>.</>)}
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "rgba(60,48,36,0.55)" }}>
              Click the link in your email to activate your account. Don&apos;t forget to check your spam folder.
            </p>
            <SecondaryButton onClick={() => setPageState("login")}>Back to sign in</SecondaryButton>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-2">
        <Logo />
        <p className="mt-1 text-sm" style={{ color: "rgba(60,48,36,0.50)" }}>Your edge, organized.</p>
      </div>

      <AuthCard>
        {heading("Sign in", "Enter your credentials to access your account")}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || urlError) && <ErrorNote>{error || urlError}</ErrorNote>}

          <div className="space-y-2">
            <Label htmlFor="email" style={{ color: "rgba(15,12,8,0.75)" }}>Email</Label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-2">
              <Label htmlFor="password" style={{ color: "rgba(15,12,8,0.75)" }}>Password</Label>
              <Link href="/reset-password" className="text-xs transition-colors text-[rgba(60,48,36,0.45)] hover:text-[#14B8A6]">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(60,48,36,0.40)] transition-colors hover:text-[#14B8A6]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <SubmitButton loading={isLoading}>
            {isLoading ? "Signing in" : "Sign in"}
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "rgba(60,48,36,0.50)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#14B8A6] transition-colors hover:text-[#0D9488]">Sign up</Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
