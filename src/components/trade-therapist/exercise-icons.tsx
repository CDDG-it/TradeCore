"use client";

import {
  CalendarCheck2, ChartNoAxesCombined, Clapperboard, FolderCheck, Gauge,
  GitFork, Lightbulb, ListChecks, Mountain, RotateCcw, ScanEye, Shield,
  Waves, Zap, type LucideIcon,
} from "lucide-react";
import type { ExerciseTypeId } from "@/lib/types";

// A distinct, recognisable symbol for each exercise in the library and session header.
const ICONS: Record<ExerciseTypeId, LucideIcon> = {
  loss_win_review: ChartNoAxesCombined,
  mental_contrasting: Mountain,
  pre_mortem: ScanEye,
  mental_rehearsal: Clapperboard,
  rules_recall: ListChecks,
  state_check: Gauge,
  scenario_plan: GitFork,
  post_loss_reset: RotateCcw,
  calm_plan: Waves,
  impulse_gate: Shield,
  follow_through: CalendarCheck2,
  thrill_outlet: Zap,
  idea_parking: Lightbulb,
  evidence_file: FolderCheck,
};

export function ExerciseIcon({ id, size = 18 }: { id: ExerciseTypeId; size?: number }) {
  const Icon = ICONS[id];
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
