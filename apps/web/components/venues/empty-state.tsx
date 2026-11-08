import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "No venues found",
  description = "No venues within this radius. Try a larger radius.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label="No results"
      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
        <MapPinOff className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-[var(--foreground)]">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-[var(--muted-foreground)]">{description}</p>
      {actionLabel && onAction && (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
