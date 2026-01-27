// src/components/profile/CreatorList.tsx

import { CreatorChip } from "./CreatorChip";
import type { CreatorDTO } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface CreatorListProps {
  creators: CreatorDTO[];
  onRemove: (creatorId: string) => void;
  isLoading?: boolean;
  removingCreatorId?: string;
}

/**
 * List of selected creators displayed as chips
 * Shows warning if less than 3 creators selected
 */
export function CreatorList({ creators, onRemove, isLoading = false, removingCreatorId }: CreatorListProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-32 rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state
  if (creators.length === 0) {
    return (
      <div className="text-center py-8 px-4 border-2 border-dashed border-border rounded-lg">
        <p className="text-sm text-muted-foreground">
          Nie masz jeszcze ulubionych twórców. Użyj wyszukiwarki powyżej, aby dodać twórców.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning for less than 3 creators */}
      {creators.length < 3 && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-900 dark:text-yellow-200"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 text-sm">
            <p className="font-medium">Zalecamy wybrać co najmniej 3 twórców</p>
            <p className="mt-1 text-xs opacity-90">Im więcej twórców dodasz, tym lepsze będą Twoje rekomendacje.</p>
          </div>
        </div>
      )}

      {/* List of creator chips */}
      <div className="flex flex-wrap gap-2" role="list" aria-label="Lista ulubionych twórców">
        {creators.map((creator) => (
          <CreatorChip
            key={creator.id}
            creator={creator}
            onRemove={onRemove}
            isPending={removingCreatorId === creator.id}
          />
        ))}
      </div>
    </div>
  );
}
