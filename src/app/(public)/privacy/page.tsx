import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</Link>
          <h1 className="text-3xl font-bold mt-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mt-1">Last updated: October 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">What we store</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            TradingMC stores the following data to provide its journal and dashboard functionality:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
            <li>Your email address and display name (used for authentication)</li>
            <li>Trade journal entries including instrument, result, R:R, session, notes, and execution details</li>
            <li>Pre-market analyses including bias, thesis, and chart notes</li>
            <li>Funded account records including firm name, account size, and payout history</li>
            <li>Connected broker account snapshots and imported trade details, including account, instrument, execution times, quantity, costs, and P&amp;L where available</li>
            <li>Encrypted, revocable Tradovate OAuth tokens needed to refresh a connection</li>
            <li>Daily self-improvement data including journal entries, mental state scores, and sleep data</li>
            <li>Habit completion data</li>
            <li>Chart screenshots uploaded to trade journal and analysis entries</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Broker connections and imports</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tradovate connections use OAuth access configured for reading accounts, orders, and fills. We do not store
            broker passwords or trading-capable API keys. Broker tokens are stored encrypted on the server and are never
            returned to your browser. Disconnecting a broker removes its stored tokens and connected account history.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            CSV exports are parsed in your browser. We receive only the trade records you select for import, not the
            original file. You can review imported records before adding them to your journal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Screenshots</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Screenshots you upload are stored in a private, access-controlled storage bucket. They are only accessible
            to your account and cannot be viewed by other users. Screenshots may contain sensitive trading information
            such as account balances and chart patterns: they are stored solely to support your personal trading journal
            and are never shared with third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Data isolation</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            User-facing data is protected with Row Level Security (RLS). Broker credentials are accessible only to
            authenticated server routes, which check your identity and filter records by your user ID. Other users
            cannot read, write, or delete your records through the app.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Third-party services</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            TradingMC uses Supabase (hosted PostgreSQL and file storage) to store your data. Supabase is a SOC 2
            compliant platform. Your data resides in the EU region. We do not sell or share your data with advertisers
            or analytics providers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Data deletion</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can request full deletion of your account and all associated data by emailing{" "}
            <a href="mailto:info@cddegroot.nl" className="text-primary hover:underline">info@cddegroot.nl</a>.
            We will process your request within 30 days. We do not claim full legal compliance (GDPR, CCPA) at this stage
            of development: deletion requests are handled manually.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions about your data?{" "}
            <a href="mailto:info@cddegroot.nl" className="text-primary hover:underline">info@cddegroot.nl</a>
          </p>
        </section>
      </div>
    </div>
  );
}
