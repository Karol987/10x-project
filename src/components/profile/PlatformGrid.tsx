// src/components/profile/PlatformGrid.tsx

import { PlatformCard } from "./PlatformCard";
import type { PlatformDTO } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface PlatformGridProps {
  allPlatforms: PlatformDTO[];
  selectedPlatformIds: string[];
  onToggle: (platformIds: string[]) => void;
  isLoading?: boolean;
  isPending?: boolean;
}

/**
 * Grid of platform cards with selection management
 * Prevents deselecting the last platform (minimum 1 required)
 */
export function PlatformGrid({
  allPlatforms,
  selectedPlatformIds,
  onToggle,
  isLoading = false,
  isPending = false,
}: PlatformGridProps) {
  const handleToggle = (platformId: string) => {
    const isSelected = selectedPlatformIds.includes(platformId);

    if (isSelected) {
      // Deselecting - remove from list
      const newSelection = selectedPlatformIds.filter((id) => id !== platformId);
      onToggle(newSelection);
    } else {
      // Selecting - add to list
      const newSelection = [...selectedPlatformIds, platformId];
      onToggle(newSelection);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state
  if (allPlatforms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Brak dostępnych platform</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
      role="group"
      aria-label="Wybór platform VOD"
    >
      {allPlatforms.map((platform) => {
        const isSelected = selectedPlatformIds.includes(platform.id);
        // Disable deselection if this is the last selected platform
        const isDisabled = isSelected && selectedPlatformIds.length === 1;

        return (
          <PlatformCard
            key={platform.id}
            platform={platform}
            isSelected={isSelected}
            onToggle={handleToggle}
            isDisabled={isDisabled}
            isPending={isPending}
          />
        );
      })}
    </div>
  );
}

