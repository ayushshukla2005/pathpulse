import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { useGlassFallback } from "./use-glass-fallback";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "primary" | "secondary" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  fallback?: boolean;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    { className, variant = "default", size = "default", asChild = false, fallback, ...props },
    ref,
  ) => {
    const isFallback = useGlassFallback(fallback);
    const Comp = asChild ? Slot : "button";

    const variantClasses = {
      default: isFallback
        ? "bg-[var(--card)] text-[var(--card-foreground)] hover:bg-[var(--muted)] border-2 border-[var(--border)] shadow-none backdrop-blur-none"
        : "bg-[var(--glass-surface)] text-[var(--foreground)] hover:bg-[var(--secondary)] border-2 border-[var(--glass-border)] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)]",
      primary:
        "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 border-2 border-transparent shadow-sm",
      secondary:
        "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90 border-2 border-[var(--border)] shadow-sm",
      destructive:
        "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90 border-2 border-transparent shadow-sm",
      ghost:
        "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)] border-2 border-transparent shadow-none",
    }[variant];

    const sizeClasses = {
      default: "h-11 px-5 py-2 text-base",
      sm: "h-9 px-3 text-sm",
      lg: "h-12 px-8 text-lg font-semibold",
      icon: "h-10 w-10",
    }[size];

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          isFallback && "glass-fallback",
          !isFallback && "glass-button",
          variantClasses,
          sizeClasses,
          className,
        )}
        {...props}
      />
    );
  },
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
