import { redirect } from "next/navigation";

/**
 * My Strategy now lives as the Strategy half of My Edge. This route is kept so
 * existing links and bookmarks land on the right tab rather than a 404.
 */
export default function StrategyPage() {
  redirect("/psychological-edge?tab=rules");
}
