import * as React from "react";

interface ShimmerSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function ShimmerSkeleton({
  className = "h-4 w-full rounded",
  ...props
}: ShimmerSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`shimmer-skeleton ${className}`}
      {...props}
    >
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
