import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

export interface GlassDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  triggerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export function GlassDialog({
  open,
  onClose,
  title,
  description,
  children,
  triggerRef,
  className,
}: GlassDialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElementRef.current =
      triggerRef?.current ?? (document.activeElement as HTMLElement | null);

    const dialogNode = dialogRef.current;
    if (!dialogNode) {
      return;
    }

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusable = dialogNode.querySelectorAll<HTMLElement>(focusableSelector);
    const initialFocus = focusable[0];
    if (initialFocus) {
      initialFocus.focus();
    } else {
      dialogNode.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const elements = dialogNode.querySelectorAll<HTMLElement>(focusableSelector);
        if (elements.length === 0) {
          event.preventDefault();
          return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (!first || !last) {
          return;
        }

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const toFocus = triggerRef?.current ?? previousActiveElementRef.current;
      if (toFocus && typeof toFocus.focus === "function") {
        toFocus.focus();
      }
    };
  }, [open, onClose, triggerRef]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <GlassCard
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="glass-dialog-title"
        aria-describedby={description ? "glass-dialog-description" : undefined}
        tabIndex={-1}
        className={cn("w-full max-w-md shadow-2xl outline-none", className)}
      >
        <h2 id="glass-dialog-title" className="text-lg font-bold text-[var(--foreground)] mb-2">
          {title}
        </h2>
        {description ? (
          <p id="glass-dialog-description" className="text-sm text-[var(--muted-foreground)] mb-4">
            {description}
          </p>
        ) : null}
        {children}
      </GlassCard>
    </div>
  );
}
