"use client";

import { PageHeader } from "@/components/ui/page-header";

/**
 * MC Trade Therapist — intentionally empty for now. The route and its header
 * exist so the tab is live in the navigation; the feature itself is still to
 * be built out.
 */
export default function TradeTherapistPage() {
  return (
    <div className="space-y-5">
      <PageHeader badge="MC Mindset formula" title="MC Trade Therapist" />
    </div>
  );
}
