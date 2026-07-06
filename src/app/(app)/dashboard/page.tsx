"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Plus, Check, Eye, EyeOff, LayoutGrid, Settings2 } from "lucide-react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { getProfile } from "@/lib/supabase/queries";
import { usePrivacy } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import { HomeWidget } from "@/components/home/widgets";
import {
  WIDGETS, DEFAULT_WIDGETS, loadWidgets, saveWidgets,
  type WidgetId, type WidgetSource,
} from "@/lib/home/widgets";

export default function HomePage() {
  const { hidden, toggle } = usePrivacy();
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);

  const [widgets, setWidgets] = useState<WidgetId[]>(DEFAULT_WIDGETS);
  const [editing, setEditing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    getProfile().then((p) => {
      if (p?.full_name) setFirstName(p.full_name.split(" ")[0]);
    });
    setWidgets(loadWidgets());
  }, []);

  function update(next: WidgetId[]) {
    setWidgets(next);
    saveWidgets(next);
  }

  function removeWidget(id: WidgetId) {
    update(widgets.filter((w) => w !== id));
  }

  function toggleWidget(id: WidgetId) {
    update(widgets.includes(id) ? widgets.filter((w) => w !== id) : [...widgets, id]);
  }

  // Group the picker by the page each widget comes from.
  const grouped = useMemo(() => {
    const map = new Map<WidgetSource, typeof WIDGETS>();
    for (const w of WIDGETS) {
      const list = map.get(w.source) ?? [];
      list.push(w);
      map.set(w.source, list);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-start justify-between gap-4 mb-8"
      >
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Daily
          </p>
          <h1 className="font-heading font-black text-3xl md:text-4xl text-foreground tracking-tight leading-[0.95]">
            Home
          </h1>
          {greeting && (
            <p className="font-body text-lg font-semibold text-foreground mt-3">
              {greeting}{firstName ? `, ${firstName}` : ""}
            </p>
          )}
          <p className="font-body text-sm font-light text-muted-foreground mt-1 leading-relaxed">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Home controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggle}
            title={hidden ? "Show balances" : "Hide balances (privacy mode)"}
            aria-pressed={hidden}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border"
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors border",
              editing
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Settings2 className="w-4 h-4" />
            {editing ? "Done" : "Customize"}
          </button>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <Plus className="w-4 h-4" />
            Add widget
          </button>
        </div>
      </motion.div>

      <PageWrapper>
        {widgets.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center animate-fade-up"
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderStyle: "dashed" }}
          >
            <LayoutGrid className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mb-3">Your Home is empty.</p>
            <button
              onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors text-primary"
            >
              <Plus className="w-3.5 h-3.5" /> Add your first widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
            {widgets.map((id) => (
              <HomeWidget key={id} id={id} editing={editing} onRemove={removeWidget} />
            ))}
          </div>
        )}
      </PageWrapper>

      {/* Add widget picker */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add widgets</DialogTitle>
            <DialogDescription>
              Pick widgets from across the app. Each one links to its full page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {grouped.map(([source, list]) => (
              <div key={source} className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{source}</p>
                <div className="space-y-1.5">
                  {list.map((w) => {
                    const enabled = widgets.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleWidget(w.id)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors border",
                          enabled
                            ? "bg-primary/8 border-primary/30"
                            : "bg-secondary/40 border-border hover:border-primary/30 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{w.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{w.description}</p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-semibold shrink-0 rounded-md px-2 py-1 transition-colors",
                            enabled ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {enabled ? <><Check className="w-3.5 h-3.5" /> Added</> : <><Plus className="w-3.5 h-3.5" /> Add</>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
