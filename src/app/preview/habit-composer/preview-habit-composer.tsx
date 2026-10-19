"use client";

import { useState } from "react";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/mobile-nav";
import { HabitComposer } from "@/components/habits/habit-composer";

export function PreviewHabitComposer() {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-dvh bg-background">
      <TopNav />
      <main className="p-6">
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">New habit</button>
      </main>
      <HabitComposer open={open} habit={null} onOpenChange={setOpen} onSubmit={() => new Promise((resolve) => setTimeout(resolve, 800)).then(() => setOpen(false))} />
      <BottomNav />
    </div>
  );
}
