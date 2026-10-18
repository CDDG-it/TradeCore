import { redirect } from "next/navigation";

/** My Trade Profile now lives inside MC Trade Therapist; keep old links working. */
export default function TradeProfilePage() {
  redirect("/trade-therapist?tab=profile");
}
