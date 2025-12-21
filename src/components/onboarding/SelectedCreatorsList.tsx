// src/components/onboarding/SelectedCreatorsList.tsx

import type { CreatorDTO } from "../../types";
import { CreatorChip } from "./CreatorChip";
import { cn } from "@/lib/utils";

interface SelectedCreatorsListProps {
  creators: CreatorDTO[];
  onRemove: (id: string) => void;
  minRequired?: number;
}

/**
 * Display list of selected creators as removable chips
 * Shows progress counter and validation status
 */
export function SelectedCreatorsList({ creators, onRemove, minRequired = 3 }: SelectedCreatorsListProps) {
  const isValid = creators.length >= minRequired;
  const remaining = Math.max(0, minRequired - creators.length);

  return (
    <div className="space-y-4">
      {/* Header with counter */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Wybrani twórcy</h3>
        <div
          className={cn(
            "text-sm font-medium px-2.5 py-1 rounded-md transition-colors",
            isValid
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          )}
          role="status"
          aria-live="polite"
        >
          {creators.length} / {minRequired}
        </div>
      </div>

      {/* Validation message */}
      {!isValid && creators.length > 0 && (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Wybierz jeszcze {remaining} {remaining === 1 ? "twórcę" : "twórców"}
        </p>
      )}

      {/* Empty state */}
      {creators.length === 0 && (
        <div className="text-center py-8 px-4 border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Zacznij wyszukiwać i dodawać swoich ulubionych twórców</p>
        </div>
      )}

      {/* Chips list */}
      {creators.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Lista wybranych twórców">
          {creators.map((creator) => (
            <CreatorChip key={creator.id} creator={creator} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
