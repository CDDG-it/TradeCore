import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowDown, Brain, ScanLine, BookOpen, Check, MoveUpRight } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { ScreenshotShowcase } from "@/components/landing/screenshot-showcase";
import habits from "../../public/screenshots/habits.png";
import styles from "./home.module.css";

const practices = [
  { number: "01", title: "Prepare with intention.", text: "Check in with yourself. Review your trading rules and decide what a well-executed session looks like before you enter.", tag: "Before the session", icon: Brain },
  { number: "02", title: "Capture more than the trade.", text: "Journal your execution and the thinking behind it. Give your future self the context a P&L number cannot provide.", tag: "During the session", icon: BookOpen },
  { number: "03", title: "Reflect. Adjust. Repeat.", text: "Review your results alongside your habits. Recognize recurring patterns and choose what to work on next.", tag: "After the session", icon: ScanLine },
];

export default function HomePage() {
  return (
    <div className={styles.home} id="top">
      <a className={styles.skip} href="#main">Skip to content</a>
      <header className={styles.header}>
        <div className={styles.nav}>
          <Link href="/" aria-label="TradingMC home"><Logo size={36} /></Link>
          <nav aria-label="Main navigation" className={styles.navLinks}><a href="#platform">The platform</a><a href="#practice">Your practice</a><a href="#questions">FAQ</a></nav>
          <div className={styles.accountLinks}><Link href="/login">Sign in</Link><Link href="/signup" className={styles.smallButton}>Get started <ArrowRight size={15} /></Link></div>
        </div>
      </header>
      <main id="main">
        <section className={styles.hero}>
          <div className={styles.eyebrow}><span /> THE MINDSET BEHIND THE TRADE</div>
          <h1>Your edge starts<br />with <em>you.</em></h1>
          <p>A clearer mind. A more deliberate trader.<br className={styles.desktopBreak} /> Bring your journal, psychology and daily habits into one focused workspace.</p>
          <div className={styles.actions}><Link href="/signup" className={styles.primary}>Build your trading practice <ArrowRight size={18} /></Link><a href="#platform" className={styles.secondary}>Explore the platform <ArrowDown size={17} /></a></div>
          <div className={styles.heroNote}><span><Check size={14} /> Built for futures traders</span><span><Check size={14} /> Focused on your process</span></div>
        </section>
        <section id="platform" className={styles.platform} aria-label="Explore the TradingMC platform"><ScreenshotShowcase /></section>
        <div className={styles.manifesto}><span>WHERE SELF-IMPROVEMENT MEETS TRADING</span><p>You track the market.<br /><strong>Start understanding the trader.</strong></p></div>
        <section id="practice" className={styles.section}>
          <div className={styles.sectionHeading}><div><span className={styles.kicker}>A MORE INTENTIONAL ROUTINE</span><h2>Train the part of trading<br />that is yours to control.</h2></div><p>Good habits need a place to grow. Build a repeatable practice around preparation, execution and honest reflection.</p></div>
          <div className={styles.cards}>{practices.map(item => <article className={styles.card} key={item.number}><div className={styles.cardTop}><item.icon size={25} strokeWidth={1.5} /><span>{item.number}</span></div><span className={styles.cardTag}>{item.tag}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
        </section>
        <section className={`${styles.section} ${styles.mindSection}`}>
          <div className={styles.mindCopy}><span className={styles.kicker}>PSYCHOLOGY, PUT INTO PRACTICE</span><h2>Small daily actions.<br /><em>A stronger foundation.</em></h2><p>Your routine deserves the same attention as your setup. Track the habits that support your trading, set meaningful goals and make room for reflection.</p><ul><li><Check size={17} /> Build and track your personal habits</li><li><Check size={17} /> Keep your trading rules close</li><li><Check size={17} /> Reflect on discipline with MC Mindscore</li></ul><Link href="/psychological-edge" className={styles.textLink}>Discover your Mind Edge <ArrowRight size={17} /></Link></div>
          <figure className={styles.habitFigure}><div className={styles.figureLabel}><Brain size={19} /><span>A practice you can come back to.</span></div><a href={habits.src} target="_blank" rel="noopener noreferrer" aria-label="View full-size habits screenshot (opens in a new tab)"><Image src={habits} alt="TradingMC habit tracker with daily check-ins and habit progress" sizes="(max-width: 800px) 92vw, 600px" /></a><figcaption>Your habits. Your progress. One place to reflect.</figcaption></figure>
        </section>
        <section id="questions" className={`${styles.section} ${styles.faq}`}><div><span className={styles.kicker}>A LITTLE MORE CLARITY</span><h2>Before you begin.</h2></div><div>{[
          ["Who is TradingMC for?", "TradingMC is built for futures and commodities traders who want to work on their decision-making, discipline and consistency alongside their trading performance."],
          ["What can I do in the platform?", "Record trades, explore your analytics, track daily habits, set goals and define your trading rules. Your workspace brings your results and your process together."],
          ["How does it support trading psychology?", "Habit check-ins, journaling and reflection help you pay attention to how you trade. Mind Edge brings habits, goals and MC Mindscore together so you can build your own ongoing practice."],
          ["Does TradingMC provide trading signals?", "TradingMC focuses on your trading process and self-improvement. It does not promise returns or tell you which trades to take."],
        ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
        <section className={styles.cta}><LogoMark size={60} /><span className={styles.kicker}>MAKE PROGRESS A PRACTICE</span><h2>The next thing to work on?<br /><em>Yourself.</em></h2><p>Build a trading routine with more awareness and intention.</p><Link href="/signup" className={styles.primary}>Create your account <ArrowRight size={18} /></Link></section>
      </main>
      <footer className={styles.footer}><div className={styles.footerTop}><div><Link href="/" aria-label="TradingMC home"><Logo size={34} /></Link><p>Where self-improvement meets trading.</p></div><nav aria-label="Footer navigation"><a href="#platform">Platform</a><Link href="/login">Sign in</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} TradingMC</span><span>Built for the work beyond the charts.</span><a href="#top">Back to top <MoveUpRight size={14} /></a></div></footer>
    </div>
  );
}
