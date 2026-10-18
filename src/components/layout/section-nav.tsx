"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SectionNavItem<T extends string> {
  key: T;
  label: string;
}

/** One shared section picker for My Edge, Trade Therapist and Global Markets. */
export function SectionNav<T extends string>({
  title,
  titleClassName,
  items,
  value,
  onChange,
}: {
  title: string;
  titleClassName?: string;
  items: readonly SectionNavItem<T>[];
  value: T;
  onChange: (key: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = items.find((item) => item.key === value)?.label ?? "unknown";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <h1 className={cn("min-w-0", titleClassName)}>
        <DropdownMenuTrigger
          aria-label={`${title}. Current section: ${selectedLabel}. Open sections`}
          className={cn("section-nav-trigger group/section inline-flex max-w-full min-w-0 items-center gap-2.5 rounded-2xl py-1 text-left text-inherit outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary", open && "section-nav-trigger-open")}
          style={{ font: "inherit" }}
        >
          <span className="min-w-0 whitespace-normal leading-[1.25] sm:whitespace-nowrap">{title}</span>
          <span className="section-nav-current inline-flex min-w-0 shrink-0 items-center gap-2 rounded-full border px-3 py-2">
            <span className="section-nav-current-dot size-1.5 shrink-0 rounded-full" aria-hidden />
            <span className="max-w-24 truncate text-[11px] font-semibold leading-none tracking-normal sm:max-w-36">{selectedLabel}</span>
            <ChevronDown aria-hidden className={cn("section-nav-chevron size-3.5 shrink-0", open && "section-nav-chevron-open")} />
          </span>
        </DropdownMenuTrigger>
      </h1>
      <DropdownMenuContent
        align="start"
        sideOffset={10}
        aria-label={`${title} sections`}
        style={{ animation: "none" }}
        className="section-nav-menu w-[min(19rem,calc(100vw-2rem))] rounded-[22px] border p-2 shadow-[0_24px_70px_rgba(0,0,0,.48)]"
      >
        <div className="px-3 pb-2 pt-2.5 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{title}</div>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onClick={() => { onChange(item.key); setOpen(false); }}
            aria-current={item.key === value ? "page" : undefined}
            className={cn(
              "section-nav-item flex min-h-11 items-center gap-3 rounded-2xl border border-transparent px-3 text-sm font-medium",
              item.key === value ? "section-nav-item-active text-primary" : "text-foreground/80"
            )}
          >
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.key === value && <Check aria-hidden className="size-3.5 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
