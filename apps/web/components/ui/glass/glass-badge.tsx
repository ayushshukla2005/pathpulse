import * as React from "react";
import { cn } from "@/lib/utils";
import { useGlassFallback } from "./use-glass-fallback";

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  fallback?: boolean;
}

const GlassBadge = React.forwardRef<HTMLDivElement, GlassBadgeProps>(
  ({ className, variant = "default", fallback, ...props }, ref) => {
    const isFallback = useGlassFallback(fallback);

    const variantClasses = {
      default: isFallback
        ? "bg-[var(--card)] text-[var(--card-foreground)] border-2 border-[var(--border)] shadow-none backdrop-blur-none"
        : "bg-emerald-950 text-emerald-100 border border-emerald-700/60 shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)] dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-500/60",
      secondary:
        "bg-amber-950 text-amber-100 border border-amber-700/60 shadow-none dark:bg-amber-950 dark:text-amber-100 dark:border-amber-500/60",
      destructive:
        "bg-red-950 text-red-100 border border-red-700/60 shadow-none dark:bg-red-950 dark:text-red-100 dark:border-red-500/60",
      outline:
        "bg-transparent text-[var(--foreground)] border-2 border-[var(--border)] shadow-none",
    }[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          isFallback && "glass-fallback",
          !isFallback && "glass-badge",
          variantClasses,
          className,
        )}
        {...props}
      />
    );
  },
);
GlassBadge.displayName = "GlassBadge";

export { GlassBadge };
