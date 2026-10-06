"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useScrollNav } from "@/lib/ui/use-scroll-nav";
import { cn } from "@/lib/utils";

/** A page's sections stay available without occupying a separate navigation row. */
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
  const { visible, show } = useScrollNav(open || focusMode);

  if (!onClient) return null;

  return createPortal(
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={`Section: ${active?.label ?? "Select section"}. Choose another section`}
        onFocus={show}
        className={cn(
          "fixed right-3 top-[4.25rem] z-30 inline-flex h-9 max-w-[55vw] shrink-0 items-center gap-2 rounded-lg border border-border/60 bg-card/95 px-3.5 text-xs font-semibold tracking-[0.01em] text-foreground shadow-[0_12px_32px_rgba(0,0,0,.25)] outline-none backdrop-blur-md transition-[transform,opacity,border-color,color] duration-200 ease-[var(--ease-out-strong)] hover:border-primary/50 hover:text-primary data-[popup-open]:border-primary/50 motion-reduce:transition-[opacity,border-color] sm:right-6 sm:top-[5.25rem] lg:right-10",
          !focusMode && !visible && !open && "pointer-events-none -translate-y-3 opacity-0 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100",
          className
        )}
      >
        <span className="truncate">{focusMode ? "Sections" : active?.label ?? "Sections"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={7} className="w-56 rounded-xl border border-border/60 bg-popover p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.35)] transition-[transform,opacity] duration-200 ease-[var(--ease-out-strong)] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-opacity motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[ending-style]:scale-100">
        {items.map((item) => {
          return (
            <DropdownMenuItem
              key={item.key}
              onClick={() => onChange(item.key)}
              className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-medium"
            >
              <span className="flex-1">{item.label}</span>
              {item.key === value && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>,
    document.body
  );
}
