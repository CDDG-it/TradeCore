/** A stable shell while a route segment or its client bundle is on its way. */
export default function AppLoading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading page" aria-busy="true">
      <div className="h-7 w-44 animate-pulse rounded-lg bg-card/80" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-40 animate-pulse rounded-2xl border border-border/50 bg-card/60 md:col-span-2" />
        <div className="h-40 animate-pulse rounded-2xl border border-border/50 bg-card/60" />
      </div>
      <div className="h-52 animate-pulse rounded-2xl border border-border/50 bg-card/60" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}
