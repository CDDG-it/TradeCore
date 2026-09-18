import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1120]/95 px-6 backdrop-blur-xl sm:px-10 lg:px-12">
      <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between gap-2 sm:gap-6">
        <Link href="/" className="font-display shrink-0 text-lg font-semibold tracking-[-0.055em] text-white transition-opacity hover:opacity-75 sm:text-[22px]">Trading<span className="text-[#46cabc]">MC</span></Link>
        <nav aria-label="Account" className="flex shrink-0 items-center gap-2 text-xs font-medium sm:gap-3 sm:text-[13px]"><Link href="/login" className="inline-flex min-h-10 items-center rounded-2xl border border-white/20 px-3 text-[#d0dfe1] transition-colors hover:border-white/50 hover:bg-white/5 sm:px-5">Sign in</Link><Link href="/signup" className="inline-flex min-h-10 items-center rounded-2xl bg-[#14b8a6] px-3 text-[#081721] transition-colors hover:bg-[#70d9cf] sm:px-5">Get started</Link></nav>
      </div>
    </header>
  );
}
