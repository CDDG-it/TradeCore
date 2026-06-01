"use client";

import { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, X, ZoomIn } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getAnalysisById, updateAnalysis } from "@/lib/supabase/queries";
import type { PreTradeAnalysis } from "@/lib/types";
import type { Bias } from "@/lib/types";
import { cn } from "@/lib/utils";

const INSTRUMENTS = ["NQ", "ES", "GOLD"];
const BIASES: Bias[] = ["bullish", "bearish", "choppy"];

function compressImage(file: File, maxWidth = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ChartTab({
  label, timeframe, onTimeframeChange, urls, onUrlsChange, placeholder,
}: {
  label: string; timeframe: string; onTimeframeChange: (v: string) => void;
  urls: string[]; onUrlsChange: (urls: string[]) => void; placeholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  async function processFiles(files: FileList | File[]) {
    const toAdd = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 5 - urls.length);
    if (!toAdd.length) return;
    setLoading(true);
    try {
      const compressed = await Promise.all(toAdd.map((f) => compressImage(f)));
      onUrlsChange([...urls, ...compressed]);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Timeframe</Label>
        <Input value={timeframe} onChange={(e) => onTimeframeChange(e.target.value)}
          placeholder={placeholder} className="h-9 text-sm bg-background/50 font-mono max-w-48" />
      </div>
      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-border/60 bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button type="button" onClick={() => setLightbox(url)}
                  className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-foreground hover:bg-white">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => onUrlsChange(urls.filter((_, idx) => idx !== i))}
                  className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-destructive hover:bg-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {urls.length < 5 && (
        <button type="button" onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
          disabled={loading}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 text-xs text-muted-foreground transition-all",
            dragging ? "border-primary/60 bg-primary/4 text-primary" : "border-border/50 hover:border-primary/40 hover:bg-muted/30",
            loading && "opacity-60 cursor-wait"
          )}>
          <ImagePlus className={cn("w-5 h-5", dragging ? "text-primary" : "text-muted-foreground/60")} />
          {loading ? <span>Processing...</span> : (
            <>
              <span className="font-medium">{urls.length === 0 ? `Add ${label} screenshots` : "Add more"}</span>
              <span className="text-muted-foreground/60">Click or drag & drop · {5 - urls.length} remaining</span>
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)} />
      {lightbox && (
        <div className="screenshot-lightbox-overlay" onClick={() => setLightbox(null)}>
          <button type="button" onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default function EditAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [analysis, setAnalysis] = useState<PreTradeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"htf" | "ltf">("htf");

  const [form, setFormState] = useState({
    date: new Date().toISOString().split("T")[0],
    instrument: "",
    bias: "bullish" as Bias,
    thesis: "",
    long_scenario: "",
    short_scenario: "",
  });
  const [htfTF, setHtfTF] = useState("4H / Daily");
  const [ltfTF, setLtfTF] = useState("15m / 5m");
  const [htfUrls, setHtfUrls] = useState<string[]>([]);
  const [ltfUrls, setLtfUrls] = useState<string[]>([]);

  useEffect(() => {
    getAnalysisById(id).then((a) => {
      if (!a) { setNotFound(true); setLoading(false); return; }
      setAnalysis(a);
      const existingHtf = a.screenshot_groups?.find((g) => g.label.startsWith("HTF"));
      const existingLtf = a.screenshot_groups?.find((g) => g.label.startsWith("LTF"));
      setFormState({
        date: a.date,
        instrument: a.instrument,
        bias: a.bias as Bias,
        thesis: a.thesis,
        long_scenario: a.long_scenario ?? "",
        short_scenario: a.short_scenario ?? "",
      });
      setHtfTF(() => {
        if (!existingHtf) return "4H / Daily";
        const parts = existingHtf.label.split(" · ");
        return parts.length > 1 ? parts.slice(1).join(" · ") : "4H / Daily";
      });
      setLtfTF(() => {
        if (!existingLtf) return "15m / 5m";
        const parts = existingLtf.label.split(" · ");
        return parts.length > 1 ? parts.slice(1).join(" · ") : "15m / 5m";
      });
      setHtfUrls(existingHtf?.urls ?? []);
      setLtfUrls(existingLtf?.urls ?? []);
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!analysis) return;
    setSaving(true);
    try {
      await updateAnalysis(id, {
        ...form,
        title: `${form.instrument} — ${form.date}`,
        market: analysis.market,
        session: analysis.session,
        notes: "",
        used_for_trade: analysis.used_for_trade,
        screenshot_groups: [
          { label: `HTF${htfTF ? ` · ${htfTF}` : ""}`, urls: htfUrls },
          { label: `LTF${ltfTF ? ` · ${ltfTF}` : ""}`, urls: ltfUrls },
        ],
      });
      router.push(`/analysis/${id}`);
    } catch (err) {
      console.error("Failed to save analysis:", err);
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground text-sm">Analysis not found.</p>
      <Link href="/analysis" className="text-primary text-sm hover:underline mt-2 inline-block">← Back</Link>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/analysis/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Analysis
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Analysis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{form.instrument} · {form.date}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Instrument *</Label>
                <div className="flex gap-1.5">
                  {INSTRUMENTS.map((inst) => (
                    <button key={inst} type="button" onClick={() => set("instrument", inst)}
                      className={cn("flex-1 py-1.5 rounded-lg text-sm font-medium transition-all font-mono",
                        form.instrument === inst ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {inst}
                    </button>
                  ))}
                </div>
                {!INSTRUMENTS.includes(form.instrument) && (
                  <Input value={form.instrument} onChange={(e) => set("instrument", e.target.value.toUpperCase())}
                    className="h-8 text-sm mt-1" placeholder="Custom instrument" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="h-9 text-sm" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bias</Label>
              <div className="flex gap-1.5">
                {BIASES.map((b) => (
                  <button key={b} type="button" onClick={() => set("bias", b)}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                      form.bias === b
                        ? b === "bullish" ? "bg-success text-success-foreground"
                          : b === "bearish" ? "bg-destructive text-white"
                          : "bg-warning text-warning-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Thesis *</Label>
              <Textarea value={form.thesis} onChange={(e) => set("thesis", e.target.value)}
                className="text-sm min-h-24 resize-none" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Long Scenario <span className="ml-1 text-success text-[10px] font-semibold uppercase">↑</span></Label>
                <Textarea value={form.long_scenario} onChange={(e) => set("long_scenario", e.target.value)}
                  className="text-sm min-h-28 resize-none border-success/25 focus-visible:ring-success/30" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Short Scenario <span className="ml-1 text-destructive text-[10px] font-semibold uppercase">↓</span></Label>
                <Textarea value={form.short_scenario} onChange={(e) => set("short_scenario", e.target.value)}
                  className="text-sm min-h-28 resize-none border-destructive/25 focus-visible:ring-destructive/30" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Charts</CardTitle>
              <div className="flex gap-1">
                {(["htf", "ltf"] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                    className={cn("px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all",
                      activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {tab}
                    {(tab === "htf" ? htfUrls : ltfUrls).length > 0 && (
                      <span className={cn("ml-1.5 text-[10px]", activeTab === tab ? "opacity-70" : "opacity-50")}>
                        {(tab === "htf" ? htfUrls : ltfUrls).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "htf" ? (
              <ChartTab label="HTF" timeframe={htfTF} onTimeframeChange={setHtfTF}
                urls={htfUrls} onUrlsChange={setHtfUrls} placeholder="e.g. 4H / Daily" />
            ) : (
              <ChartTab label="LTF" timeframe={ltfTF} onTimeframeChange={setLtfTF}
                urls={ltfUrls} onUrlsChange={setLtfUrls} placeholder="e.g. 15m / 5m" />
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/analysis/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
