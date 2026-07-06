import { redirect } from "next/navigation";

// Self-Improvement has been replaced by Trading Behaviour, which is where the
// trading rules and confluence library are now managed. Any old links land there.
export default function SelfImprovementPage() {
  redirect("/trading-behaviour");
}
