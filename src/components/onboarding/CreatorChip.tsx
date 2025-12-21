// src/components/onboarding/CreatorChip.tsx

import { X } from "lucide-react";
import type { CreatorDTO } from "../../types";
import { cn } from "@/lib/utils";

interface CreatorChipProps {
  creator: CreatorDTO;
  onRemove: (id: string) => void;
}

/**
 * Visual "pill" representation of a selected creator
 * Displays creator name with a remove button
 */
export function CreatorChip({ creator, onRemove }: CreatorChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-secondary text-secondary-foreground text-sm font-medium",
        "border border-border",
        "transition-all animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      role="listitem"
    >
      <span className="truncate max-w-[200px]">{creator.name}</span>
      <button
        type="button"
        onClick={() => onRemove(creator.id)}
        className={cn(
          "size-4 rounded-full flex items-center justify-center",
          "hover:bg-secondary-foreground/10 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        )}
        aria-label={`Usuń ${creator.name}`}
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </div>
  );
}
