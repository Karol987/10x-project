// src/components/onboarding/SearchResultsList.tsx

import type { CreatorDTO } from "../../types";
import { SearchResultItem } from "./SearchResultItem";
import { cn } from "@/lib/utils";

interface SearchResultsListProps {
  results: CreatorDTO[];
  onSelect: (creator: CreatorDTO) => void;
  isSearching: boolean;
  searchQuery: string;
}

/**
 * List of search results with accessibility support
 * Displays creators matching the search query
 */
export function SearchResultsList({ results, onSelect, isSearching, searchQuery }: SearchResultsListProps) {
  // Don't show results if query is too short
  if (searchQuery.length < 2) {
    return null;
  }

  // Show loading state
  if (isSearching) {
    return (
      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50",
          "bg-background border border-input rounded-md shadow-lg",
          "max-h-[320px] overflow-y-auto"
        )}
        role="status"
        aria-live="polite"
      >
        <div className="p-4 text-center text-sm text-muted-foreground">Wyszukiwanie...</div>
      </div>
    );
  }

  // Show empty state
  if (results.length === 0 && searchQuery.length >= 2) {
    return (
      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50",
          "bg-background border border-input rounded-md shadow-lg",
          "max-h-[320px] overflow-y-auto"
        )}
        role="status"
        aria-live="polite"
      >
        <div className="p-4 text-center text-sm text-muted-foreground">Nie znaleźliśmy twórcy o takim nazwisku</div>
      </div>
    );
  }

  // Show results
  if (results.length > 0) {
    return (
      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50",
          "bg-background border border-input rounded-md shadow-lg",
          "max-h-[320px] overflow-y-auto"
        )}
        role="listbox"
        aria-label="Wyniki wyszukiwania twórców"
        aria-live="polite"
      >
        {results.map((creator) => (
          <SearchResultItem key={creator.id} creator={creator} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  return null;
}
