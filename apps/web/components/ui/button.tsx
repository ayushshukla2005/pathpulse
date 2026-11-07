import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const variantClasses = {
      default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm",
      destructive:
        "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90 shadow-sm",
      outline:
        "border-2 border-[var(--border)] bg-transparent hover:bg-[var(--muted)] text-[var(--foreground)]",
      secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90",
      ghost: "hover:bg-[var(--muted)] text-[var(--foreground)]",
      link: "text-[var(--primary)] underline-offset-4 hover:underline",
    }[variant];

    const sizeClasses = {
      default: "h-11 px-5 py-2 text-base",
      sm: "h-9 px-3 text-sm",
      lg: "h-12 px-8 text-lg font-semibold",
      icon: "h-10 w-10",
    }[size];

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variantClasses,
          sizeClasses,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
