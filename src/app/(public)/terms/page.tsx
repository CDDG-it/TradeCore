import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</Link>
          <h1 className="text-3xl font-bold mt-4">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mt-1">Last updated: June 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. What TradingMC is</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            TradingMC is a personal trading productivity platform. It provides tools for journaling trades,
            tracking funded accounts, logging pre-market analyses, and monitoring trading habits and mental state.
            TradingMC is not a financial advisor, broker, or trading platform. No part of TradingMC constitutes
            financial advice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Your account</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are responsible for maintaining the security of your account credentials. Use a strong, unique
            password. Do not share your account with others. You are responsible for all activity under your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Acceptable use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You may use TradingMC for personal trading journaling purposes only. You may not:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
            <li>Upload illegal content or malware</li>
            <li>Attempt to access other users&apos; data</li>
            <li>Reverse-engineer or attempt to compromise the platform</li>
            <li>Use TradingMC for commercial resale or sublicensing</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Your data</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You own your trading data. TradingMC stores it on your behalf to provide the service. We do not claim
            ownership of your journal entries, analyses, or screenshots. See our{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details on how
            your data is stored and protected.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. No financial warranties</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            TradingMC is a journaling and productivity tool. We make no claims about improving trading performance
            or profitability. Trading involves significant financial risk. Use this tool at your own discretion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Service availability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            TradingMC is provided as-is. We aim for high availability but do not guarantee 100% uptime.
            We may modify or discontinue features with reasonable notice. This is an early-stage product.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions?{" "}
            <a href="mailto:info@cddegroot.nl" className="text-primary hover:underline">info@cddegroot.nl</a>
          </p>
        </section>
      </div>
    </div>
  );
}
