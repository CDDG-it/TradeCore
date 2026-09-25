"use client";

import { Suspense, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

gsap.registerPlugin(useGSAP);

type PageState = "login" | "unverified" | "resent";

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
        const message = error.message.toLowerCase();
        if (message.includes("email not confirmed") || message.includes("not confirmed")) setPageState("unverified");
        else if (message.includes("invalid login credentials") || message.includes("invalid email or password")) setError("Invalid email or password.");
        else setError(error.message);
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
      const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/confirm` } });
      if (!error) {
        setPageState("resent");
        return;
      }
      const message = error.message.toLowerCase();
      if (message.includes("rate limit") || message.includes("after") || message.includes("seconds")) setError("Please wait a moment before requesting another email.");
      else if (message.includes("already confirmed") || message.includes("already registered")) setError("This email is already verified. Try signing in.");
      else setError("Could not send verification email. Please try again in a few minutes.");
    } catch {
      setError("Could not send verification email. Please try again in a few minutes.");
    } finally {
      setIsResending(false);
    }
  }

  if (pageState === "unverified") {
    return (
      <AuthShell>
        <AccountState title="Verify your email" description={<>Your account still needs confirmation. Open the email sent to <strong className="font-semibold text-white">{email}</strong> or request a new link.</>}>
          {error && <ErrorNote>{error}</ErrorNote>}
          <PrimaryButton type="button" onClick={handleResend} loading={isResending}>{isResending ? "Sending email..." : "Resend verification email"}</PrimaryButton>
          <SecondaryButton onClick={() => setPageState("login")}>Back to sign in</SecondaryButton>
        </AccountState>
      </AuthShell>
    );
  }

  if (pageState === "resent") {
    return (
      <AuthShell>
        <AccountState title="Check your inbox" description={<>A new verification link has been sent to <strong className="font-semibold text-white">{email}</strong>. Open it to activate your account.</>}>
          <p className="rounded-2xl border border-[#14b8a6]/25 bg-[#14b8a6]/10 px-5 py-4 text-base leading-7 text-[#9ce8df]">The email may take a moment to arrive. Check your spam folder if you do not see it.</p>
          <SecondaryButton onClick={() => setPageState("login")}>Back to sign in</SecondaryButton>
        </AccountState>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="grid w-full gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-center lg:gap-20">
        <section className="login-copy max-w-3xl">
          <p className="text-lg font-medium text-[#65d4c8]">Your process is waiting.</p>
          <h1 className="mt-6 max-w-3xl text-balance text-[clamp(3rem,6vw,6.25rem)] font-semibold leading-[.91] tracking-[-.065em] text-white">Return to the work that builds your edge.</h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#b8ccd0] sm:text-xl sm:leading-9">Review your decisions, measure your discipline and keep building the habits behind consistent execution.</p>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-7 text-base font-medium text-[#d9e8e9]">
            <span>One focused workspace</span><span>Your data stays yours</span><span>Progress made visible</span>
          </div>
        </section>

        <section className="login-panel">
          <InteractivePanel className="p-6 sm:p-9">
            <div className="relative z-10">
              <h2 className="text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">Welcome back</h2>
              <p className="mt-3 text-base leading-7 text-[#9db6bb]">Sign in to continue your TradingMC process.</p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {(error || urlError) && <ErrorNote>{error || urlError}</ErrorNote>}
                <Field label="Email address" htmlFor="email">
                  <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} />
                </Field>
                <Field label="Password" htmlFor="password" action={<Link href="/reset-password" className="text-sm font-medium text-[#9edfd8] transition-colors hover:text-white">Forgot password?</Link>}>
                  <div className="relative">
                    <input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={`${inputClass} pr-20`} />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#91aab0] transition-colors hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
                  </div>
                </Field>
                <PrimaryButton loading={isLoading}>{isLoading ? "Signing in..." : "Sign in"}</PrimaryButton>
              </form>
              <p className="mt-7 border-t border-white/10 pt-6 text-center text-base text-[#9db6bb]">New to TradingMC? <Link href="/signup" className="font-semibold text-[#8de0d5] transition-colors hover:text-white">Create an account</Link></p>
            </div>
          </InteractivePanel>
        </section>
      </div>
    </AuthShell>
  );
}

function AccountState({ title, description, children }: { title: string; description: React.ReactNode; children: React.ReactNode }) {
  return <section className="login-panel mx-auto max-w-2xl"><InteractivePanel className="p-7 text-center sm:p-12"><div className="relative z-10"><p className="text-lg font-medium text-[#65d4c8]">TradingMC account</p><h1 className="mt-5 text-balance text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[.95] tracking-[-.055em] text-white">{title}</h1><p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#aac2c7]">{description}</p><div className="mx-auto mt-9 max-w-md space-y-3">{children}</div></div></InteractivePanel></section>;
}

const inputClass = "h-14 w-full rounded-2xl border border-white/10 bg-white/[.045] px-4 text-base text-white outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[#718b92] hover:border-white/20 focus:border-[#65d4c8]/65 focus:bg-white/[.06] focus:ring-4 focus:ring-[#14b8a6]/10";

function Field({ label, htmlFor, action, children }: { label: string; htmlFor: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="space-y-2.5"><div className="flex items-baseline justify-between gap-4"><Label htmlFor={htmlFor} className="text-base font-medium text-[#e4eff0]">{label}</Label>{action}</div>{children}</div>;
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return <div role="alert" className="rounded-2xl border border-red-300/15 bg-red-400/10 px-5 py-4 text-base leading-6 text-red-100">{children}</div>;
}

function PrimaryButton({ loading, children, onClick, type = "submit" }: { loading: boolean; children: React.ReactNode; onClick?: () => void; type?: "submit" | "button" }) {
  return <button type={type} onClick={onClick} disabled={loading} className="mt-2 h-14 w-full rounded-2xl bg-[#14b8a6] px-5 text-base font-bold text-[#06151c] shadow-[0_14px_36px_rgba(20,184,166,.22)] transition-[transform,background-color,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:bg-[#70d9cf] hover:shadow-[0_18px_44px_rgba(20,184,166,.3)] active:translate-y-0 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0">{children}</button>;
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="h-14 w-full rounded-2xl border border-white/15 bg-white/[.03] px-5 text-base font-semibold text-white transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-[#65d4c8]/50 hover:bg-white/[.07] active:translate-y-0 active:scale-[.985]">{children}</button>;
}

function InteractivePanel({ children, className }: { children: React.ReactNode; className?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const hasFocusWithin = useRef(false);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!panel.current || hasFocusWithin.current || event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = panel.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    gsap.to(panel.current, { rotateY: (x - 0.5) * 3.5, rotateX: (0.5 - y) * 3.5, y: -4, duration: 0.25, ease: "power3.out", transformPerspective: 1100, overwrite: "auto" });
    if (glow.current) gsap.to(glow.current, { xPercent: x * 100 - 50, yPercent: y * 100 - 50, opacity: 0.7, duration: 0.25, ease: "power3.out", overwrite: "auto" });
  }

  function resetPanel() {
    if (!panel.current) return;
    gsap.killTweensOf(panel.current);
    gsap.to(panel.current, { rotateX: 0, rotateY: 0, y: 0, duration: 0.2, ease: "power3.out" });
    if (glow.current) {
      gsap.killTweensOf(glow.current);
      gsap.to(glow.current, { opacity: 0.28, duration: 0.2, ease: "power3.out" });
    }
  }

  function handleFocus() {
    hasFocusWithin.current = true;
    resetPanel();
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hasFocusWithin.current = false;
  }

  return <div className="[perspective:1100px]"><div ref={panel} onPointerMove={handlePointerMove} onPointerLeave={resetPanel} onFocusCapture={handleFocus} onBlurCapture={handleBlur} className={`group relative overflow-hidden rounded-[30px] border border-white/[.11] bg-[#0d1c29]/95 shadow-[0_36px_100px_rgba(0,0,0,.48)] backdrop-blur-xl transition-[border-color,box-shadow] duration-500 focus-within:border-[#65d4c8]/35 focus-within:shadow-[0_40px_110px_rgba(0,0,0,.5),0_0_0_1px_rgba(101,212,200,.08)] ${className ?? ""}`}><div ref={glow} aria-hidden className="pointer-events-none absolute -left-1/2 -top-1/2 h-full w-full rounded-full bg-[#14b8a6]/20 opacity-30 blur-[70px]" /><div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.055),transparent_38%,rgba(20,184,166,.035))]" />{children}</div></div>;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.timeline({ defaults: { ease: "power3.out" } }).from(".login-logo", { opacity: 0, y: -14, duration: 0.6 }).from(".login-copy > *", { opacity: 0, y: 28, stagger: 0.09, duration: 0.75 }, "-=.25").from(".login-panel", { opacity: 0, y: 36, scale: 0.96, duration: 0.9 }, "-=.65");
  }, { scope: root });

  return <main ref={root} className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#0b1120] px-5 py-7 text-white sm:px-8 sm:py-9 lg:flex lg:items-center lg:py-12"><div aria-hidden className="marketing-grid pointer-events-none absolute inset-0 opacity-20" /><div aria-hidden className="pointer-events-none absolute -left-40 top-1/4 h-[34rem] w-[34rem] rounded-full bg-[#06b6d4]/[.08] blur-[120px]" /><div aria-hidden className="pointer-events-none absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[#14b8a6]/[.1] blur-[130px]" /><div className="relative mx-auto w-full max-w-[1380px]"><Link href="/" aria-label="TradingMC home" className="login-logo inline-block transition-opacity hover:opacity-75"><Image src="/tradingmc-logo.png" alt="TradingMC" width={979} height={500} priority className="h-11 w-auto sm:h-12" /></Link><div className="mt-12 sm:mt-16 lg:mt-20">{children}</div></div></main>;
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
