import { redirect } from "next/navigation";

// Habits now lives inside the Psychological Edge hub. Old links land there.
export default function HabitsPage() {
  redirect("/psychological-edge");
}
