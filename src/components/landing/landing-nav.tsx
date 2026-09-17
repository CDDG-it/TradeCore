import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1120]/95 px-6 backdrop-blur-xl sm:px-10 lg:px-12">
      <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between gap-6">
        <Link href="/" className="shrink-0 text-[19px] font-semibold tracking-[-0.055em] text-white transition-opacity hover:opacity-75">Trading<span className="text-[#46cabc]">MC</span></Link>
        <nav aria-label="Landing page sections" className="hidden items-center gap-9 text-[13px] font-medium text-[#a7bcc3] md:flex">
          <a href="#the-problem" className="transition-colors hover:text-white">The problem</a>
          <a href="#the-method" className="transition-colors hover:text-white">The approach</a>
          <a href="#the-moments" className="transition-colors hover:text-white">Between sessions</a>
        </nav>
        <nav aria-label="Account" className="flex shrink-0 items-center gap-4 text-[13px] font-medium sm:gap-6"><Link href="/login" className="text-[#bbccd1] transition-colors hover:text-white">Sign in</Link><Link href="/signup" className="rounded-[4px] border border-[#14b8a6] px-4 py-2.5 text-[#a4eee6] transition-colors hover:bg-[#14b8a6] hover:text-[#071820]">Get started</Link></nav>
      </div>
    </header>
  );
}
