import * as React from "react";
import { cn } from "@/lib/utils";
import { useGlassFallback } from "./use-glass-fallback";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  fallback?: boolean;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, fallback, ...props }, ref) => {
    const isFallback = useGlassFallback(fallback);

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border p-4 transition-colors",
          isFallback
            ? "glass-fallback bg-[var(--card)] border-2 border-[var(--border)] text-[var(--card-foreground)] shadow-none backdrop-blur-none"
            : "glass-panel bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--foreground)] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)]",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
