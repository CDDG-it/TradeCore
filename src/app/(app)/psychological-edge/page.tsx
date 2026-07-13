"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import {
  Brain, Sunrise, Moon, LineChart, Check, Loader2, TrendingDown,
  AlertTriangle, ShieldCheck, Info,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { cn } from "@/lib/utils";
import { getTrades, getDailyEdge, getAllDailyEdge, saveDailyEdge } from "@/lib/supabase/queries";
import { detectPriorDay, computeEdgeInsights, type EdgeInsights } from "@/lib/psych-edge";
import type { DailyEdge, DailyEdgeInput, RuleFollowed, TradeJournalEntry } from "@/lib/types";

const TODAY = format(new Date(), "yyyy-MM-dd");
const ACCENT = "oklch(0.70 0.12 183)"; // turquoise, matches the Mindset formula

type Screen = "pre" | "post" | "insight";

const emptyEntry = (date: string): DailyEdgeInput => ({
  date,
  yesterday_loss: false,
  loss_trade: null,
  was_own_fault: null,
  fault_reason: null,
  revenge_urge: null,
  daily_rule: null,
  rule_followed: null,
  triggered_extra: false,
  sized_up: false,
  note: null,
});

export default function PsychologicalEdgePage() {
  const [screen, setScreen] = useState<Screen>("pre");
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [edges, setEdges] = useState<DailyEdge[]>([]);
  const [entry, setEntry] = useState<DailyEdgeInput>(emptyEntry(TODAY));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    Promise.all([getTrades(), getDailyEdge(TODAY), getAllDailyEdge()]).then(([t, today, all]) => {
      setTrades(t);
      setEdges(all);
      if (today) {
        // Existing row for today — load it as-is.
        const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ...rest } = today;
        void _id; void _u; void _c; void _up;
        setEntry(rest);
      } else {
        // No entry yet — seed "yesterday loss" from the journal.
        const prior = detectPriorDay(t, TODAY);
        setEntry({ ...emptyEntry(TODAY), yesterday_loss: prior?.outcome === "loss" });
      }
      setLoaded(true);
    });
  }, []);

  const prior = useMemo(() => (trades ? detectPriorDay(trades, TODAY) : null), [trades]);
  const insights = useMemo(
    () => (trades ? computeEdgeInsights(trades, edges) : null),
    [trades, edges]
  );

  function set<K extends keyof DailyEdgeInput>(key: K, value: DailyEdgeInput[K]) {
    setEntry((e) => ({ ...e, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaveError(false);
    try {
      const rev = await saveDailyEdge(entry);
      // Keep the in-memory list current so Insights update without a reload.
      setEdges((list) => [...list.filter((e) => e.date !== rev.date), rev]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  const priorLossDate = prior?.date ? format(new Date(prior.date + "T12:00:00"), "EEEE, MMM d") : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        badge="MC Mindset Formula"
        title="Psychological Edge"
        subtitle="Are you trading differently after a losing day? Track it, and make the pattern visible."
      />

      <PageWrapper className="space-y-6">
        {/* Screen tabs */}
        <div className="flex w-full sm:w-fit rounded-lg border border-border/60 overflow-hidden">
          {([
            { key: "pre", label: "Pre-session", Icon: Sunrise },
            { key: "post", label: "Post-session", Icon: Moon },
            { key: "insight", label: "Insights", Icon: LineChart },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setScreen(key)}
              className={cn(
                "flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors",
                screen === key ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              style={screen === key ? { background: ACCENT } : undefined}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : screen === "pre" ? (
          <PreSession
            entry={entry}
            set={set}
            prior={prior ? { ...prior, label: priorLossDate! } : null}
          />
        ) : screen === "post" ? (
          <PostSession entry={entry} set={set} />
        ) : (
          <Insights insights={insights!} />
        )}

        {/* Save bar — Pre & Post both write today's row */}
        {loaded && screen !== "insight" && (
          <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-4">
            {saved && <span className="text-xs text-success flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Saved</span>}
            {saveError && <span className="text-xs text-destructive">Could not save. Run the latest SQL migration (daily_edge) in Supabase.</span>}
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-40"
              style={{ background: ACCENT }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {saving ? "Saving" : "Save"}
            </button>
          </div>
        )}
      </PageWrapper>
    </div>
  );
}

// ── Small shared controls ────────────────────────────────────────────
function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)} style={style}>{children}</div>
  );
}

function Segmented<T extends string>({
  value, options, onChange,
}: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-all border",
              active ? "text-white" : "text-muted-foreground border-border bg-secondary hover:text-foreground"
            )}
            style={active ? { background: ACCENT, borderColor: ACCENT } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ n, children }: { n?: number; children: React.ReactNode }) {
  return (
    <label className="flex items-baseline gap-2 text-sm font-semibold text-foreground/90 mb-2">
      {n != null && <span className="text-xs font-bold tabular-nums" style={{ color: ACCENT }}>{n}</span>}
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

// ── Screen 1: Pre-session ────────────────────────────────────────────
function PreSession({
  entry, set, prior,
}: {
  entry: DailyEdgeInput;
  set: <K extends keyof DailyEdgeInput>(k: K, v: DailyEdgeInput[K]) => void;
  prior: { date: string; netR: number; outcome: string; label: string } | null;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <FieldLabel>Was yesterday a loss day?</FieldLabel>
        {prior && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />
            From your journal, {prior.label} closed at{" "}
            <span className={cn("font-semibold", prior.netR < 0 ? "text-destructive" : prior.netR > 0 ? "text-success" : "text-warning")}>
              {prior.netR > 0 ? "+" : ""}{prior.netR.toFixed(1)}R
            </span>.
          </p>
        )}
        <Segmented
          value={entry.yesterday_loss ? "loss" : "clear"}
          options={[
            { value: "loss", label: "Loss day" },
            { value: "clear", label: "No / break-even" },
          ]}
          onChange={(v) => set("yesterday_loss", v === "loss")}
        />
      </Card>

      {!entry.yesterday_loss ? (
        <Card className="flex items-center gap-3 border-success/30 bg-success/5">
          <ShieldCheck className="w-5 h-5 shrink-0 text-success" />
          <p className="text-sm text-foreground/80">You&apos;re clear. Trade your plan — no protocol needed today.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: ACCENT }}>
            <TrendingDown className="w-4 h-4" /> Day-after-loss protocol
          </div>

          <Card className="space-y-5">
            <div>
              <FieldLabel n={1}>Which trade did the most damage yesterday?</FieldLabel>
              <input
                className={inputCls}
                placeholder="One sentence — name the specific setup."
                value={entry.loss_trade ?? ""}
                onChange={(e) => set("loss_trade", e.target.value || null)}
              />
            </div>

            <div>
              <FieldLabel n={2}>Was it a valid setup that failed, or your own mistake?</FieldLabel>
              <Segmented
                value={entry.was_own_fault == null ? null : entry.was_own_fault ? "fault" : "valid"}
                options={[
                  { value: "valid", label: "Valid setup" },
                  { value: "fault", label: "My mistake" },
                ]}
                onChange={(v) => set("was_own_fault", v === "fault")}
              />
            </div>

            {entry.was_own_fault === true && (
              <div>
                <FieldLabel n={3}>What went wrong?</FieldLabel>
                <input
                  className={inputCls}
                  placeholder="One sentence."
                  value={entry.fault_reason ?? ""}
                  onChange={(e) => set("fault_reason", e.target.value || null)}
                />
              </div>
            )}

            <div>
              <FieldLabel n={entry.was_own_fault === true ? 4 : 3}>
                How strong is the urge to win it back today?
              </FieldLabel>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = entry.revenge_urge === n;
                  return (
                    <button
                      key={n}
                      onClick={() => set("revenge_urge", n)}
                      className={cn(
                        "h-10 flex-1 rounded-lg text-sm font-bold transition-all border",
                        active ? "text-white" : "text-muted-foreground border-border bg-secondary hover:text-foreground"
                      )}
                      style={active ? { background: ACCENT, borderColor: ACCENT } : undefined}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/60">
                <span>Not at all</span><span>Strongly present</span>
              </div>
            </div>
          </Card>

          <Card style={{ borderColor: "oklch(0.70 0.12 183 / 0.4)" }}>
            <FieldLabel>Your rule for today</FieldLabel>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
              <span className="text-foreground/80">Today I only trade when</span>
              <input
                className={cn(inputCls, "flex-1 min-w-[200px]")}
                placeholder="…I see an A+ setup from my playbook"
                value={entry.daily_rule ?? ""}
                onChange={(e) => set("daily_rule", e.target.value || null)}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">This is your own rule — you&apos;ll see it again in the post-session debrief.</p>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Screen 2: Post-session ───────────────────────────────────────────
function PostSession({
  entry, set,
}: {
  entry: DailyEdgeInput;
  set: <K extends keyof DailyEdgeInput>(k: K, v: DailyEdgeInput[K]) => void;
}) {
  const showExtra = entry.triggered_extra || entry.sized_up;
  return (
    <div className="space-y-5">
      {entry.yesterday_loss && entry.daily_rule && (
        <Card style={{ borderColor: "oklch(0.70 0.12 183 / 0.4)", background: "oklch(0.70 0.12 183 / 0.06)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">This morning&apos;s rule</p>
          <p className="text-sm font-semibold text-foreground">Today I only trade when {entry.daily_rule}.</p>
        </Card>
      )}

      <Card className="space-y-5">
        {entry.yesterday_loss && (
          <div>
            <FieldLabel n={1}>Did you follow your rule?</FieldLabel>
            <Segmented<RuleFollowed>
              value={entry.rule_followed}
              options={[
                { value: "ja", label: "Yes" },
                { value: "deels", label: "Partially" },
                { value: "nee", label: "No" },
              ]}
              onChange={(v) => set("rule_followed", v)}
            />
          </div>
        )}

        <div>
          <FieldLabel n={entry.yesterday_loss ? 2 : 1}>
            Did a loss today lead to a trade that normally wouldn&apos;t be there?
          </FieldLabel>
          <Segmented
            value={entry.triggered_extra ? "y" : "n"}
            options={[{ value: "y", label: "Yes" }, { value: "n", label: "No" }]}
            onChange={(v) => set("triggered_extra", v === "y")}
          />
        </div>

        <div>
          <FieldLabel n={entry.yesterday_loss ? 3 : 2}>
            After a loss, did you size up or hold longer than planned?
          </FieldLabel>
          <Segmented
            value={entry.sized_up ? "y" : "n"}
            options={[{ value: "y", label: "Yes" }, { value: "n", label: "No" }]}
            onChange={(v) => set("sized_up", v === "y")}
          />
        </div>

        {showExtra && (
          <div>
            <FieldLabel>Which trade? <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
            <input
              className={inputCls}
              placeholder="Name the trade."
              value={entry.note ?? ""}
              onChange={(e) => set("note", e.target.value || null)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Screen 3: Insights ───────────────────────────────────────────────
function fmtR(v: number | null): string {
  if (v == null) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}R`;
}

function Insights({ insights: i }: { insights: EdgeInsights }) {
  const maxAbs = Math.max(0.5, Math.abs(i.avgRDayAfterLoss ?? 0), Math.abs(i.avgROther ?? 0));
  const bar = (v: number | null) => (v == null ? 0 : Math.min(100, (Math.abs(v) / maxAbs) * 100));
  const barColor = (v: number | null) => (v == null ? "var(--muted)" : v < 0 ? "oklch(0.58 0.22 25)" : "oklch(0.58 0.17 145)");

  return (
    <div className="space-y-5">
      {!i.ready && (
        <Card className="flex items-center gap-3 border-warning/30 bg-warning/5">
          <AlertTriangle className="w-5 h-5 shrink-0 text-warning" />
          <p className="text-sm text-foreground/80">
            Insights sharpen after ~20 trading days. You have <span className="font-bold">{i.tradingDays}</span> so far — numbers below use what&apos;s logged.
          </p>
        </Card>
      )}

      {/* Chart: day-after-loss vs other days */}
      <Card>
        <p className="text-sm font-semibold mb-1">P&amp;L: day-after-loss vs other days</p>
        <p className="text-xs text-muted-foreground mb-4">Average net R per trading day.</p>
        <div className="space-y-3">
          {[
            { label: "Day after a loss", v: i.avgRDayAfterLoss },
            { label: "Every other day", v: i.avgROther },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-muted-foreground">{row.label}</span>
              <div className="flex-1 h-6 rounded-md bg-muted/40 overflow-hidden">
                <div className="h-full rounded-md transition-all" style={{ width: `${bar(row.v)}%`, background: barColor(row.v) }} />
              </div>
              <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums" style={{ color: barColor(row.v) }}>
                {fmtR(row.v)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Four numbers */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Stat
          label="Day-after-loss vs other"
          value={fmtR(i.avgRDayAfterLoss)}
          sub={`vs ${fmtR(i.avgROther)} on other days`}
        />
        <Stat
          label="Chased after a loss"
          value={i.pctExtraOrSizedUp == null ? "—" : `${i.pctExtraOrSizedUp}%`}
          sub="of tracked days had an extra trade or size-up"
        />
        <Stat
          label="Days to recover a loss"
          value={i.avgDaysToRecovery == null ? "—" : i.avgDaysToRecovery.toFixed(1)}
          sub="average trading days to earn the loss back"
        />
        <Stat
          highlight
          label="Rule followed → payoff"
          value={i.pctRuleFollowed == null ? "—" : `${i.pctRuleFollowed}%`}
          sub={
            i.avgRWhenFollowed == null && i.avgRWhenNotFollowed == null
              ? "of day-after-loss days followed the rule"
              : `${fmtR(i.avgRWhenFollowed)} when followed vs ${fmtR(i.avgRWhenNotFollowed)} when not`
          }
        />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />
        The last one is the point: it shows whether the protocol actually changes your results.
      </p>
    </div>
  );
}

function Stat({
  label, value, sub, highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: highlight ? "oklch(0.70 0.12 183 / 0.08)" : "var(--card)",
        borderColor: highlight ? "oklch(0.70 0.12 183 / 0.4)" : "var(--border)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: highlight ? ACCENT : "var(--foreground)" }}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-snug">{sub}</p>
    </div>
  );
}
