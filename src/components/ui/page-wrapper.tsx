"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className={cn("space-y-6", className)}
    >
      {children}
    </motion.div>
  );
}
