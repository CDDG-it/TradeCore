"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Presses answer at once and settle without bounce: a control, not a toy. */
export const PRESS = { type: "spring", stiffness: 520, damping: 32, mass: 0.6 } as const;
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const MotionLinkBase = motion.create(Link);

export function buttonClass(primary: boolean, className?: string) {
  return cn(
    "group/btn relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-lg px-4 py-2 text-xs font-semibold transition-[background-color,border-color,color,box-shadow,opacity] duration-200 disabled:pointer-events-none disabled:opacity-40",
    primary
      ? "bg-primary text-primary-foreground shadow-[0_4px_16px_-6px_color-mix(in_oklch,var(--primary)_70%,transparent)] hover:shadow-[0_8px_26px_-8px_color-mix(in_oklch,var(--primary)_85%,transparent)]"
      : "border border-border/60 text-foreground hover:border-primary/40 hover:bg-primary/[.05] hover:text-primary",
    className
  );
}

/** Label plus an arrow that leans the way it points on hover; primary actions also get a light sweep. */
export function ButtonContent({ primary, back = false, arrow = true, children }: { primary: boolean; back?: boolean; arrow?: boolean; children: React.ReactNode }) {
  return (
    <>
      {primary && (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-out group-hover/btn:translate-x-[300%] group-hover/btn:opacity-100" />
      )}
      {arrow && back && <ArrowLeft className="relative h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/btn:-translate-x-1" />}
      <span className="relative">{children}</span>
      {arrow && !back && <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/btn:translate-x-1" />}
    </>
  );
}

type ButtonProps = {
  primary?: boolean;
  back?: boolean;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function MotionButton({ primary = false, back, arrow, className, children, onClick, disabled, type = "button", title }: ButtonProps & {
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} title={title} whileTap={disabled ? undefined : { scale: 0.97, transition: PRESS }} className={buttonClass(primary, className)}>
      <ButtonContent primary={primary} back={back} arrow={arrow}>{children}</ButtonContent>
    </motion.button>
  );
}

export function MotionLink({ primary = false, back, arrow, className, children, href }: ButtonProps & { href: string }) {
  return (
    <MotionLinkBase href={href} whileTap={{ scale: 0.97, transition: PRESS }} className={buttonClass(primary, className)}>
      <ButtonContent primary={primary} back={back} arrow={arrow}>{children}</ButtonContent>
    </MotionLinkBase>
  );
}
