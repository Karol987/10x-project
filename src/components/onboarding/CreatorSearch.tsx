// src/components/onboarding/CreatorSearch.tsx

import type { CreatorDTO } from "../../types";
import { SearchInput } from "./SearchInput";
import { SearchResultsList } from "./SearchResultsList";

interface CreatorSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: CreatorDTO[];
  onSelect: (creator: CreatorDTO) => void;
  isSearching: boolean;
}

/**
 * Creator search interface with real-time results
 * Combines search input and results list
 */
export function CreatorSearch({
  searchQuery,
  onSearchChange,
  searchResults,
  onSelect,
  isSearching,
}: CreatorSearchProps) {
  return (
    <div className="relative w-full">
      <SearchInput value={searchQuery} onChange={onSearchChange} isSearching={isSearching} />
      <SearchResultsList
        results={searchResults}
        onSelect={onSelect}
        isSearching={isSearching}
        searchQuery={searchQuery}
      />
    </div>
  );
}
