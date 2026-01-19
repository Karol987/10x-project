// src/components/profile/CreatorSearch.tsx

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CreatorDTO } from "@/types";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatorSearchProps {
  excludeIds: string[];
  onSelect: (creator: CreatorDTO) => void;
}

/**
 * Creator search component with debounced API calls
 * Filters out already selected creators from results
 * Minimum 2 characters required for search
 */
export function CreatorSearch({ excludeIds, onSelect }: CreatorSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const {
    data: searchResponse,
    isLoading,
    error,
  } = useQuery<{ data: CreatorDTO[] }>({
    queryKey: ["creators", "search", debouncedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/creators?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) {
        throw new Error("Nie udało się wyszukać twórców");
      }
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Extract creators array from paginated response
  const searchResults = searchResponse?.data || [];

  // Filter out already selected creators
  const filteredResults = searchResults.filter((creator) => !excludeIds.includes(creator.id));

  const handleSelect = useCallback(
    (creator: CreatorDTO) => {
      onSelect(creator);
      setQuery(""); // Clear search after selection
      setDebouncedQuery("");
    },
    [onSelect]
  );

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
  };

  const showResults = query.length >= 2 && (isLoading || filteredResults.length > 0 || error);

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wyszukaj twórców..."
          className={cn(
            "w-full h-11 pl-10 pr-10 rounded-md border border-input bg-background",
            "text-sm placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-colors"
          )}
          aria-label="Wyszukaj twórców"
          aria-describedby={query.length > 0 && query.length < 2 ? "search-hint" : undefined}
          aria-expanded={showResults ? true : undefined}
          aria-controls={showResults ? "search-results" : undefined}
          role="combobox"
          aria-autocomplete="list"
        />
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "size-5 rounded-sm opacity-70 hover:opacity-100",
              "transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Wyczyść wyszukiwanie"
          >
            <X className="size-4" />
          </button>
        )}
        {isLoading && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2"
            role="status"
            aria-live="polite"
            aria-label="Wyszukiwanie..."
          >
            <div className="size-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Hint for minimum characters */}
      {query.length > 0 && query.length < 2 && (
        <p id="search-hint" className="mt-1 text-xs text-muted-foreground">
          Wpisz co najmniej 2 znaki, aby rozpocząć wyszukiwanie
        </p>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          id="search-results"
          className={cn(
            "absolute top-full left-0 right-0 mt-2 z-50",
            "bg-background border border-input rounded-md shadow-lg",
            "max-h-[320px] overflow-y-auto"
          )}
          role="listbox"
          aria-label="Wyniki wyszukiwania twórców"
        >
          {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Wyszukiwanie...</div>}

          {error && <div className="p-4 text-center text-sm text-destructive">Wystąpił błąd podczas wyszukiwania</div>}

          {!isLoading && !error && filteredResults.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">Nie znaleziono twórcy o tym nazwisku</div>
          )}

          {!isLoading && !error && filteredResults.length > 0 && (
            <>
              {filteredResults.map((creator) => (
                <button
                  key={creator.id}
                  type="button"
                  onClick={() => handleSelect(creator)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-left",
                    "hover:bg-accent transition-colors",
                    "focus-visible:outline-none focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  )}
                  role="option"
                  aria-selected={false}
                  aria-label={`Dodaj ${creator.name}`}
                >
                  {/* Avatar */}
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      <div className="text-xs font-medium text-muted-foreground">
                        {creator.name.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{creator.name}</p>
                    {creator.creator_role && (
                      <p className="text-xs text-muted-foreground">
                        {creator.creator_role === "actor" ? "Aktor" : "Reżyser"}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
