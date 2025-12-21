// src/components/profile/CreatorChip.tsx

import { X, Loader2 } from "lucide-react";
import type { CreatorDTO } from "@/types";
import { cn } from "@/lib/utils";

interface CreatorChipProps {
  creator: CreatorDTO;
  onRemove: (id: string) => void;
  isPending?: boolean;
}

/**
 * Visual representation of a selected creator in Profile view.
 * Displays creator name, role badge, and remove button.
 * Shows loading state during removal operation.
 */
export function CreatorChip({ creator, onRemove, isPending = false }: CreatorChipProps) {
  const roleLabels: Record<string, string> = {
    actor: "Aktor",
    director: "Reżyser",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-secondary text-secondary-foreground",
        "border border-border",
        "transition-all animate-in fade-in-0 zoom-in-95 duration-200",
        isPending && "opacity-50"
      )}
      role="listitem"
    >
      {/* Avatar placeholder or image */}
      {creator.avatar_url ? (
        <img
          src={creator.avatar_url}
          alt=""
          className="size-6 rounded-full object-cover"
          loading="lazy"
          aria-hidden="true"
        />
      ) : (
        <div
          className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground"
          aria-hidden="true"
        >
          {creator.name.substring(0, 1).toUpperCase()}
        </div>
      )}

      {/* Creator info */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium truncate max-w-[200px]">{creator.name}</span>
        {creator.creator_role && (
          <span className="text-xs text-muted-foreground">
            {roleLabels[creator.creator_role] || creator.creator_role}
          </span>
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(creator.id)}
        disabled={isPending}
        className={cn(
          "ml-1 size-5 rounded-full flex items-center justify-center",
          "hover:bg-destructive/10 hover:text-destructive transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          isPending && "cursor-not-allowed"
        )}
        aria-label={`Usuń ${creator.name}`}
      >
        {isPending ? (
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        ) : (
          <X className="size-3" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

