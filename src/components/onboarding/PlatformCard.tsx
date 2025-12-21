// src/components/onboarding/PlatformCard.tsx

import { cn } from "@/lib/utils";
import type { PlatformDTO } from "@/types";
import { Check } from "lucide-react";

interface PlatformCardProps {
  platform: PlatformDTO;
  isSelected: boolean;
  onToggle: () => void;
}

/**
 * Interactive card for a single platform.
 * Displays platform logo, name, and selection state.
 * Accessible via keyboard and screen readers.
 */
export function PlatformCard({ platform, isSelected, onToggle }: PlatformCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 transition-all duration-200",
        "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "bg-card text-card-foreground",
        isSelected
          ? "border-primary bg-primary/5 shadow-md dark:bg-primary/10"
          : "border-border hover:border-primary/50 hover:bg-accent"
      )}
      aria-pressed={isSelected}
      aria-label={`${platform.name}${isSelected ? " - wybrana" : " - nie wybrana"}`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div
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
      <span className="text-sm font-medium text-center line-clamp-2">{platform.name}</span>
    </button>
  );
}
