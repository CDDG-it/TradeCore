"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SectionNavItem<T extends string> {
  key: T;
  label: string;
}

/** The page heading itself opens its sections; no second nav bar is rendered. */
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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function scheduleClose(pointerType: string) {
    if (pointerType !== "mouse") return;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  }

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <h1 className={cn("min-w-0", titleClassName)}>
        <DropdownMenuTrigger
          aria-label={`${title}. Current section: ${items.find((item) => item.key === value)?.label ?? "unknown"}. Open sections`}
          className="group/title inline-flex max-w-full items-center gap-1.5 rounded-md text-left text-inherit outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          style={{ font: "inherit" }}
          onPointerEnter={(event) => { if (event.pointerType === "mouse") { cancelClose(); setOpen(true); } }}
          onPointerLeave={(event) => scheduleClose(event.pointerType)}
        >
          <span className="truncate">{title}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-[.72em] shrink-0 text-primary/60 transition-[transform,color] duration-150 ease-[var(--ease-out-strong)] group-hover/title:text-primary group-focus-visible/title:text-primary motion-reduce:transition-colors",
              open && "rotate-180 text-primary"
            )}
          />
        </DropdownMenuTrigger>
      </h1>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        aria-label={`${title} sections`}
        style={{ animation: "none" }}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") cancelClose(); }}
        onPointerLeave={(event) => scheduleClose(event.pointerType)}
        className="section-nav-menu w-64 rounded-xl border border-border/70 bg-popover p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.38)]"
      >
        <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Sections</div>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onClick={() => { cancelClose(); onChange(item.key); setOpen(false); }}
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
    </DropdownMenu>
  );
}
