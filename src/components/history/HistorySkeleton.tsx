// src/components/history/HistorySkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

interface HistorySkeletonProps {
  count?: number;
}

/**
 * Loading skeleton for history list
 * Displays animated placeholders while content is being fetched
 */
export function HistorySkeleton({ count = 10 }: HistorySkeletonProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-4 px-4 border-b border-border last:border-b-0">
          {/* Icon skeleton */}
          <Skeleton className="size-5 rounded-md flex-shrink-0" />

          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            {/* Title skeleton */}
            <Skeleton className="h-5 w-3/4 max-w-md" />
            {/* Metadata skeleton */}
            <Skeleton className="h-4 w-1/4 max-w-xs" />
          </div>

          {/* Button skeleton */}
          <Skeleton className="size-9 rounded-md flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
