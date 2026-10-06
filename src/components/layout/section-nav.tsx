"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Layers3, type LucideIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** A page's sections stay available without occupying a separate navigation row. */
export interface SectionNavItem<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
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
  const [visible, setVisible] = useState(true);
  const positions = useRef(new WeakMap<EventTarget, number>());

  useEffect(() => {
    const onScroll = (event: Event) => {
      const target = event.target;
      if (!target || !(target instanceof Document || target instanceof Element)) return;
      const top = target instanceof Document ? window.scrollY : target.scrollTop;
      const previous = positions.current.get(target) ?? top;
      positions.current.set(target, top);
      if (top < 24 || top < previous - 8) setVisible(true);
      else if (top > previous + 10) setVisible(false);
    };
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, []);

  if (!onClient) return null;

  return createPortal(
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={`Section: ${active?.label ?? "Select section"}. Choose another section`}
        onFocus={() => setVisible(true)}
        className={cn(
          "fixed right-3 top-[4.25rem] z-30 inline-flex h-9 max-w-[55vw] shrink-0 items-center gap-2 rounded-lg border border-border/60 bg-card/90 px-3 text-xs font-semibold text-foreground shadow-[0_10px_30px_rgba(0,0,0,.15)] outline-none backdrop-blur-md transition-[transform,opacity,border-color,color] duration-200 ease-[var(--ease-out-strong)] hover:border-primary/40 hover:text-primary data-[popup-open]:border-primary/50 motion-reduce:transition-[opacity,border-color] sm:right-6 sm:top-[5.25rem] lg:right-10",
          !focusMode && !visible && !open && "pointer-events-none -translate-y-3 opacity-0 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100",
          className
        )}
      >
        {focusMode && <Layers3 className="h-3.5 w-3.5 shrink-0 text-primary" />}
        <span className="truncate">{focusMode ? "Sections" : active?.label ?? "Sections"}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={7} className="w-56 rounded-xl border border-border/60 bg-popover p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.35)] transition-[transform,opacity] duration-200 ease-[var(--ease-out-strong)] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-opacity motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:scale-100">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.key}
              onClick={() => onChange(item.key)}
              className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-medium"
            >
              {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
              <span className="flex-1">{item.label}</span>
              {item.key === value && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>,
    document.body
  );
}
