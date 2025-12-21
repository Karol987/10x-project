// src/components/onboarding/SearchInput.tsx

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSearching?: boolean;
}

/**
 * Search input component with clear button
 * Used for searching creators during onboarding
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Wyszukaj twórców...",
  isSearching = false,
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-11 pl-10 pr-10 rounded-md border border-input bg-background",
          "text-sm placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors"
        )}
        aria-label="Wyszukaj twórców"
        aria-describedby={value.length > 0 && value.length < 2 ? "search-hint" : undefined}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
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
      {isSearching && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2"
          role="status"
          aria-live="polite"
          aria-label="Wyszukiwanie..."
        >
          <div className="size-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {value.length > 0 && value.length < 2 && (
        <p id="search-hint" className="mt-1 text-xs text-muted-foreground">
          Wpisz co najmniej 2 znaki, aby rozpocząć wyszukiwanie
        </p>
      )}
    </div>
  );
}
