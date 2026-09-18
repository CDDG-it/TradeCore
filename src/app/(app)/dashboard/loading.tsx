import { DashboardDesk } from "@/components/dashboard/dashboard-desk";

/** The desk's shape, while its numbers are on their way: a card where each
 *  card will be, so nothing jumps when the real thing lands. */
function Ghost({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-2xl border border-border/40 bg-card/60 ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.5rem)] lg:overflow-hidden" aria-busy="true">
      <div className="flex shrink-0 items-end justify-between gap-3">
        <div className="h-5 w-48 animate-pulse rounded-md bg-muted/40 md:h-6" />
      </div>
      <DashboardDesk
        capital={<><Ghost className="h-[5.5rem] shrink-0" /><Ghost className="min-h-[10rem] flex-1" /></>}
        winRate={<Ghost className="h-full min-h-[16rem]" />}
        journal={<Ghost className="h-full min-h-[14rem]" />}
        mindScore={<Ghost className="h-[9.5rem] shrink-0" />}
        goals={<Ghost className="min-h-[8rem] md:min-h-0 md:flex-1" />}
        news={<Ghost className="min-h-[8rem] md:min-h-0 md:flex-1" />}
      />
    </div>
  );
}
