import { redirect } from "next/navigation";

/**
 * Option Flow now lives as a subtab of Global Markets. This route is kept so
 * existing links and bookmarks land on the right tab rather than a 404.
 */
export default function OptionFlowPage() {
  redirect("/news-city?tab=option-flow");
}
