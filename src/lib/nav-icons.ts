import { Brain, Globe, HeartPulse, House, type LucideIcon } from "lucide-react";

/** One icon vocabulary for the signed-in rail and the public product menu. */
export const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": House,
  "/psychological-edge": Brain,
  "/trade-therapist": HeartPulse,
  "/news-city": Globe,
};
