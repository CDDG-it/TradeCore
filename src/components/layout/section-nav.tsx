"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, PanelsTopLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Secondary views live in the existing top bar, never in another page row. */
export interface SectionNavItem<T extends string> {
  key: T;
  label: string;
}

const noSubscribe = () => () => {};

export function SectionNav<T extends string>({
  items,
  value,
  onChange,
  className,
  focusMode = false,
}: {
  items: readonly SectionNavItem<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
  focusMode?: boolean;
}) {
  const active = items.find((item) => item.key === value);
  const onClient = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [open, setOpen] = useState(false);
  const slot = onClient ? document.getElementById("app-section-nav-slot") : null;

  if (!slot) return null;

  return createPortal(
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={`Sections. Current: ${active?.label ?? "unknown"}`}
        title={`Sections · ${active?.label ?? ""}`}
        className={cn(
          "inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border border-sidebar-border/70 bg-white/[0.04] px-2.5 text-xs font-semibold text-sidebar-foreground/80 outline-none transition-[border-color,background-color,color] duration-150 hover:border-primary/40 hover:bg-white/[0.07] hover:text-foreground data-[popup-open]:border-primary/50 data-[popup-open]:bg-primary/10 data-[popup-open]:text-primary",
          className
        )}
      >
        <PanelsTopLeft aria-hidden className="size-4 shrink-0" />
        <span className="text-[11px] lg:hidden">Sections</span>
        <span className="hidden max-w-32 truncate 2xl:inline">{focusMode ? "Sections" : active?.label ?? "Sections"}</span>
        <ChevronDown aria-hidden className={cn("hidden size-3 shrink-0 transition-transform duration-150 motion-reduce:transition-none 2xl:block", open && "rotate-180")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={9}
        aria-label="Sections"
        style={{ animation: "none" }}
        className="section-nav-menu w-60 rounded-xl border border-border/70 bg-popover p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.38)]"
      >
        <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Sections</div>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onClick={() => { onChange(item.key); setOpen(false); }}
            aria-current={item.key === value ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-xs font-medium",
              item.key === value && "bg-primary/10 text-primary"
            )}
          >
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.key === value && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>,
    slot
  );
}
