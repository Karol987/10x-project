// src/components/onboarding/PlatformGrid.tsx

import type { PlatformDTO, UUID } from "@/types";
import { PlatformCard } from "./PlatformCard";

interface PlatformGridProps {
  platforms: PlatformDTO[];
  selectedIds: Set<UUID>;
  onToggle: (id: UUID) => void;
}

/**
 * Responsive grid displaying available platforms.
 * Adapts column count based on screen size.
 */
export function PlatformGrid({ platforms, selectedIds, onToggle }: PlatformGridProps) {
  if (platforms.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Brak dostępnych platform do wyświetlenia.</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      role="group"
      aria-label="Lista dostępnych platform streamingowych"
    >
      {platforms.map((platform) => (
        <PlatformCard
          key={platform.id}
          platform={platform}
          isSelected={selectedIds.has(platform.id)}
          onToggle={() => onToggle(platform.id)}
        />
      ))}
    </div>
  );
}
