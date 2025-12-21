// src/components/recommendations/LoadingSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

/**
 * Loading skeleton for recommendation cards
 * Displays animated placeholders while content is being fetched
 */
export function LoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="flex flex-col overflow-hidden">
          {/* Poster skeleton */}
          <Skeleton className="aspect-[2/3] w-full rounded-none" />

          <CardHeader>
            {/* Title skeleton */}
            <Skeleton className="h-5 w-3/4 mb-2" />
            {/* Subtitle skeleton */}
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            {/* Platform badges skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Creators skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
          </CardContent>

          <CardFooter>
            {/* Button skeleton */}
            <Skeleton className="h-9 w-full rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
