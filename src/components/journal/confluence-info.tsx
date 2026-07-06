"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { confluenceInfo } from "@/lib/journal/confluences";

/**
 * Wraps a confluence chip with a hover tooltip explaining what the confluence
 * means and how to use it. Shown next to every confluence chip in the Journal
 * and on the Trading Behaviour confluence library, so the meaning is always
 * one hover away instead of tribal knowledge.
 */
export function ConfluenceInfo({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            tabIndex={-1}
            className="inline-flex items-center text-current opacity-60 hover:opacity-100 transition-opacity shrink-0"
            aria-label={`What is "${label}"?`}
          />
        }
      >
        <Info className="w-3 h-3" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 normal-case font-normal leading-relaxed">
        {confluenceInfo(label)}
      </TooltipContent>
    </Tooltip>
  );
}
