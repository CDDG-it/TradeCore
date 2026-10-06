"use client";

import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** A page's sections stay available without occupying a separate navigation row. */
export interface SectionNavItem<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
}

export function SectionNav<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: readonly SectionNavItem<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  const active = items.find((item) => item.key === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Section: ${active?.label ?? "Select section"}. Choose another section`}
        className={cn(
          "inline-flex h-9 max-w-[55vw] shrink-0 items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 text-xs font-semibold text-foreground outline-none transition-colors hover:border-primary/40 hover:text-primary data-[popup-open]:border-primary/50",
          className
        )}
      >
        <span className="truncate">{active?.label ?? "Sections"}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={7} className="w-56 rounded-xl border border-border/60 bg-popover p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.35)]">
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
    </DropdownMenu>
  );
}
