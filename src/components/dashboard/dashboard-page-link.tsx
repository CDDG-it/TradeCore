import type { ComponentProps } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** A quiet, consistent way out of a dashboard card to a full page. */
export function DashboardPageLink({ children, className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        "group/page-link relative z-10 inline-flex min-h-7 shrink-0 items-center justify-center gap-1 rounded-lg border border-primary/25 bg-primary/[0.07] px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap text-primary",
        "transition-[background-color,border-color,color] duration-200 hover:border-primary/50 hover:bg-primary/[0.14] hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        className,
      )}
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="size-3 shrink-0 transition-transform duration-200 group-hover/page-link:-translate-y-0.5 group-hover/page-link:translate-x-0.5" />
    </Link>
  );
}
