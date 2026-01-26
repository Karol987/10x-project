// src/components/profile/PlatformCard.tsx

import { cn } from "@/lib/utils";
import type { PlatformDTO } from "@/types";
import { Check, Loader2 } from "lucide-react";

interface PlatformCardProps {
  platform: PlatformDTO;
  isSelected: boolean;
  onToggle: (id: string) => void;
  isDisabled?: boolean;
  isPending?: boolean;
}

/**
 * Interactive card for a single platform in Profile view.
 * Displays platform logo, name, and selection state.
 * Supports disabled state to prevent deselecting the last platform.
 * Shows loading indicator during save operations.
 */
export function PlatformCard({
  platform,
  isSelected,
  onToggle,
  isDisabled = false,
  isPending = false,
}: PlatformCardProps) {
  const handleClick = () => {
    if (!isDisabled && !isPending) {
      onToggle(platform.id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isPending}
      data-testid={`platform-card-${platform.id}`}
      data-test-id={`platform-card-${platform.id}`}
      data-platform-name={platform.name}
      data-selected={isSelected}
      data-pending={isPending}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 transition-all duration-200",
        "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "bg-card text-card-foreground",
        isSelected
          ? "border-primary bg-primary/5 shadow-md dark:bg-primary/10"
          : "border-border hover:border-primary/50 hover:bg-accent",
        (isDisabled || isPending) && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
      aria-pressed={isSelected}
      aria-label={`${platform.name}${isSelected ? " - wybrana" : " - nie wybrana"}${isDisabled ? " - nie można odznaczyć" : ""}`}
      aria-disabled={isDisabled || isPending}
    >
      {/* Loading indicator */}
      {isPending && (
        <div
          data-testid="platform-card-loading-indicator"
          data-test-id="platform-card-loading-indicator"
          className="absolute top-2 left-2 size-6 rounded-full bg-muted flex items-center justify-center"
          aria-hidden="true"
        >
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && !isPending && (
        <div
          data-testid="platform-card-selected-indicator"
          data-test-id="platform-card-selected-indicator"
          className="absolute top-2 right-2 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
          aria-hidden="true"
        >
          <Check className="size-4" />
        </div>
      )}

      {/* Platform logo */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        {platform.logo_url ? (
          <img
            src={platform.logo_url}
            alt=""
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            aria-hidden="true"
          />
        ) : (
          <div
            className="w-full h-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium"
            aria-hidden="true"
          >
            {platform.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Platform name */}
      <span className="text-sm font-medium text-center line-clamp-2" data-test-id="platform-card-name">
        {platform.name}
      </span>
    </button>
  );
}
