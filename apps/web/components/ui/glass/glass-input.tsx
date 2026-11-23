import * as React from "react";
import { cn } from "@/lib/utils";
import { useGlassFallback } from "./use-glass-fallback";

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fallback?: boolean;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, error, fallback, ...props }, ref) => {
    const isFallback = useGlassFallback(fallback);

    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        className={cn(
          "flex h-11 w-full rounded-md border-2 px-3 py-2 text-base transition-colors",
          "placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          isFallback
            ? "glass-fallback bg-[var(--card)] border-[var(--border)] text-[var(--card-foreground)] shadow-none backdrop-blur-none"
            : "glass-input bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--foreground)] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)]",
          error && "border-[var(--destructive)] focus-visible:ring-[var(--destructive)]",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassInput.displayName = "GlassInput";

export { GlassInput };
