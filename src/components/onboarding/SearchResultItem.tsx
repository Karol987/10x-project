// src/components/onboarding/SearchResultItem.tsx

import { Plus, User } from "lucide-react";
import type { CreatorDTO } from "../../types";
import { cn } from "@/lib/utils";

interface SearchResultItemProps {
  creator: CreatorDTO;
  onSelect: (creator: CreatorDTO) => void;
}

/**
 * Single search result item displaying creator information
 * Shows avatar, name, role, and add button
 */
export function SearchResultItem({ creator, onSelect }: SearchResultItemProps) {
  const roleLabel = creator.creator_role === "actor" ? "Aktor" : "Reżyser";

  return (
    <button
      type="button"
      onClick={() => onSelect(creator)}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left",
        "hover:bg-accent transition-colors",
        "focus-visible:outline-none focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      )}
      aria-label={`Dodaj ${creator.name}, ${roleLabel}`}
    >
      {/* Avatar */}
      <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {creator.avatar_url ? (
          <img src={creator.avatar_url} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <User className="size-5 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{creator.name}</p>
        <p className="text-xs text-muted-foreground">{roleLabel}</p>
      </div>

      {/* Add button icon */}
      <Plus className="size-5 text-muted-foreground shrink-0" aria-hidden="true" />
    </button>
  );
}
