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
        : "bg-[var(--glass-surface)] text-[var(--foreground)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)]",
      secondary:
        "bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] shadow-none",
      destructive:
        "bg-[var(--destructive)] text-[var(--destructive-foreground)] border border-transparent shadow-none",
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
