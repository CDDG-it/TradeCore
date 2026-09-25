"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

gsap.registerPlugin(useGSAP);

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
        options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (error) {
        setError(error.message.includes("already registered") ? "An account with this email already exists. Try signing in." : error.message);
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
      const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/confirm` } });
      if (!error) setResendSuccess(true);
    } finally {
      setIsResending(false);
    }
  }

  if (success) {
    return (
      <AuthShell>
        <InteractivePanel className="mx-auto max-w-2xl p-7 text-center sm:p-12">
          <p className="text-lg font-medium text-[#65d4c8]">Your account is almost ready</p>
          <h1 className="mt-5 text-balance text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[.95] tracking-[-.055em] text-white">Check your inbox.</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#aac2c7]">We sent a confirmation link to <strong className="font-semibold text-white">{email}</strong>. Open it to activate your TradingMC account.</p>
          <div className="mx-auto mt-9 max-w-md space-y-3">
            {resendSuccess ? <p className="rounded-2xl border border-[#14b8a6]/25 bg-[#14b8a6]/10 px-5 py-4 text-base text-[#9ce8df]">A new verification email has been sent.</p> : <Button variant="outline" className="h-14 w-full rounded-2xl border-white/15 bg-white/[.03] text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#65d4c8]/50 hover:bg-white/[.07]" onClick={handleResend} disabled={isResending}>{isResending ? "Sending email..." : "Resend verification email"}</Button>}
            <Link href="/login" className="flex h-14 items-center justify-center rounded-2xl text-base font-semibold text-[#8de0d5] transition-colors hover:bg-white/[.05] hover:text-white">Back to sign in</Link>
          </div>
        </InteractivePanel>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="grid w-full gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-center lg:gap-20">
        <section className="signup-copy max-w-3xl">
          <p className="text-lg font-medium text-[#65d4c8]">A better trading process starts here.</p>
          <h1 className="mt-6 max-w-3xl text-balance text-[clamp(3rem,6vw,6.25rem)] font-semibold leading-[.91] tracking-[-.065em] text-white">Build the trader behind the trade.</h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#b8ccd0] sm:text-xl sm:leading-9">Bring your planning, execution, habits and reviews into one focused workspace. TradingMC helps you turn intention into a process you can trust.</p>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-7 text-base font-medium text-[#d9e8e9]">
            <span>Plan with clarity</span><span>Review without bias</span><span>Improve with evidence</span>
          </div>
        </section>

        <section className="signup-panel">
          <InteractivePanel className="p-6 sm:p-9">
            <div className="relative z-10">
              <h2 className="text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">Create your account</h2>
              <p className="mt-3 text-base leading-7 text-[#9db6bb]">Start building a process that lasts. No card required.</p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {error && <div role="alert" className="rounded-2xl border border-red-300/15 bg-red-400/10 px-5 py-4 text-base leading-6 text-red-100">{error}</div>}
                <Field label="Full name" htmlFor="name"><Input id="name" type="text" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" className={inputClass} /></Field>
                <Field label="Email address" htmlFor="email"><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} /></Field>
                <Field label="Password" htmlFor="password" hint="Use at least 8 characters"><Input id="password" type="password" placeholder="Enter a secure password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} /></Field>
                <Button type="submit" className="mt-2 h-14 w-full rounded-2xl bg-[#14b8a6] text-base font-bold text-[#06151c] shadow-[0_14px_36px_rgba(20,184,166,.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#70d9cf] hover:shadow-[0_18px_44px_rgba(20,184,166,.3)] active:translate-y-0 active:scale-[.985]" disabled={isLoading}>{isLoading ? "Creating your account..." : "Create account"}</Button>
                <p className="text-center text-sm leading-6 text-[#91aab0]">By continuing, you agree to the <Link href="/terms" className="font-medium text-[#b8eeea] underline decoration-white/20 underline-offset-4 hover:text-white">Terms</Link> and <Link href="/privacy" className="font-medium text-[#b8eeea] underline decoration-white/20 underline-offset-4 hover:text-white">Privacy Policy</Link>.</p>
              </form>
              <p className="mt-7 border-t border-white/10 pt-6 text-center text-base text-[#9db6bb]">Already have an account? <Link href="/login" className="font-semibold text-[#8de0d5] transition-colors hover:text-white">Sign in</Link></p>
            </div>
          </InteractivePanel>
        </section>
      </div>
    </AuthShell>
  );
}

const inputClass = "h-14 rounded-2xl border-white/10 bg-white/[.045] px-4 text-base text-white outline-none placeholder:text-[#718b92] focus-visible:border-[#65d4c8]/65 focus-visible:ring-4 focus-visible:ring-[#14b8a6]/10";

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-2.5"><div className="flex items-baseline justify-between gap-4"><Label htmlFor={htmlFor} className="text-base font-medium text-[#e4eff0]">{label}</Label>{hint && <span className="text-sm text-[#829da4]">{hint}</span>}</div>{children}</div>;
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
    gsap.to(panel.current, { rotateY: (x - 0.5) * 3.5, rotateX: (0.5 - y) * 3.5, y: -4, duration: 0.45, ease: "power3.out", transformPerspective: 1100 });
    if (glow.current) gsap.to(glow.current, { xPercent: x * 100 - 50, yPercent: y * 100 - 50, opacity: 0.7, duration: 0.5, ease: "power3.out" });
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
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".signup-logo", { opacity: 0, y: -14, duration: 0.6 })
      .from(".signup-copy > *", { opacity: 0, y: 28, stagger: 0.09, duration: 0.75 }, "-=.25")
      .from(".signup-panel", { opacity: 0, y: 36, scale: 0.96, duration: 0.9 }, "-=.65");
  }, { scope: root });

  return <main ref={root} className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#0b1120] px-5 py-7 text-white sm:px-8 sm:py-9 lg:flex lg:items-center lg:py-12"><div aria-hidden className="marketing-grid pointer-events-none absolute inset-0 opacity-20" /><div aria-hidden className="pointer-events-none absolute -left-40 top-1/4 h-[34rem] w-[34rem] rounded-full bg-[#06b6d4]/[.08] blur-[120px]" /><div aria-hidden className="pointer-events-none absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[#14b8a6]/[.1] blur-[130px]" /><div className="relative mx-auto w-full max-w-[1380px]"><Link href="/" aria-label="TradingMC home" className="signup-logo inline-block transition-opacity hover:opacity-75"><Image src="/tradingmc-logo.png" alt="TradingMC" width={979} height={500} priority className="h-11 w-auto sm:h-12" /></Link><div className="mt-12 sm:mt-16 lg:mt-20">{children}</div></div></main>;
}
