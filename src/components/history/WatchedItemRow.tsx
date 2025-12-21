// src/components/history/WatchedItemRow.tsx
import { Trash2, Film, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WatchedItemViewModel } from "@/types";

interface WatchedItemRowProps {
  item: WatchedItemViewModel;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Individual row component for a watched item in the history list
 * Displays title, year, media type icon, and delete button
 */
export function WatchedItemRow({ item, onDelete }: WatchedItemRowProps) {
  const handleDelete = async () => {
    await onDelete(item.id);
  };

  // Determine icon based on media type
  const MediaIcon = item.media_type === "movie" ? Film : Tv;

  return (
    <div
      className="flex items-center gap-4 py-4 px-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
      role="listitem"
    >
      {/* Media type icon */}
      <div className="flex-shrink-0">
        <MediaIcon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Content section */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base truncate">{item.title}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {item.year && <span>{item.year}</span>}
          <span className="capitalize">{item.media_type === "movie" ? "Film" : "Serial"}</span>
        </div>
      </div>

      {/* Delete button */}
      <div className="flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={item.isDeleting}
          aria-label={`UsuĹ„ ${item.title} z historii`}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className={`size-4 ${item.isDeleting ? "animate-pulse" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
