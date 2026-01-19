// src/components/hooks/useCreatorSelection.ts

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { CreatorDTO, PaginatedResponse, OnboardingCreatorsCommand } from "../../types";

/**
 * Custom hook for managing creator selection during onboarding
 * Handles search, selection state, and API integration
 */
export function useCreatorSelection() {
  const [selectedCreators, setSelectedCreators] = useState<CreatorDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CreatorDTO[]>([]);
  const [status, setStatus] = useState<"idle" | "searching" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Debounced search effect
  useEffect(() => {
    // Don't search if query is too short
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    // Set searching status
    setStatus("searching");

    // Debounce delay
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/creators?q=${encodeURIComponent(searchQuery)}&limit=20`);

        if (!response.ok) {
          throw new Error("Failed to fetch creators");
        }

        const data: PaginatedResponse<CreatorDTO> = await response.json();

        // Filter out already selected creators
        const selectedIds = new Set(selectedCreators.map((c) => c.id));
        const filteredResults = data.data.filter((creator) => !selectedIds.has(creator.id));

        setSearchResults(filteredResults);
        setStatus("idle");
      } catch {
        toast.error("Nie udało się pobrać listy twórców");
        setStatus("idle");
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCreators]);

  /**
   * Add a creator to the selection
   */
  const addCreator = useCallback((creator: CreatorDTO) => {
    setSelectedCreators((prev) => {
      // Prevent duplicates
      if (prev.some((c) => c.id === creator.id)) {
        return prev;
      }
      return [...prev, creator];
    });

    // Remove from search results
    setSearchResults((prev) => prev.filter((c) => c.id !== creator.id));
  }, []);

  /**
   * Remove a creator from the selection
   */
  const removeCreator = useCallback((creatorId: string) => {
    setSelectedCreators((prev) => prev.filter((c) => c.id !== creatorId));
  }, []);

  /**
   * Update search query
   */
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setErrorMessage(undefined);
  }, []);

  /**
   * Submit the selected creators to complete onboarding
   */
  const submitCreators = useCallback(async () => {
    if (selectedCreators.length < 3) {
      setErrorMessage("Musisz wybrać co najmniej 3 twórców");
      return false;
    }

    setStatus("submitting");
    setErrorMessage(undefined);

    try {
      const command: OnboardingCreatorsCommand = {
        creators: selectedCreators.map((c) => ({
          id: c.id,
          name: c.name,
          creator_role: c.creator_role,
          avatar_url: c.avatar_url,
        })),
      };

      const response = await fetch("/api/onboarding/creators", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 422) {
          const error = await response.json();
          throw new Error(error.error || "Validation failed");
        }
        throw new Error("Failed to save creators");
      }

      // Success - redirect to home
      setStatus("idle");
      window.location.assign("/home");
      return true;
    } catch {
      setErrorMessage("Wystąpił problem z zapisem Twoich preferencji. Spróbuj ponownie.");
      setStatus("error");
      return false;
    }
  }, [selectedCreators]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setErrorMessage(undefined);
    setStatus("idle");
  }, []);

  return {
    // State
    selectedCreators,
    searchQuery,
    searchResults,
    status,
    errorMessage,
    isValid: selectedCreators.length >= 3,
    isSubmitting: status === "submitting",
    isSearching: status === "searching",

    // Actions
    addCreator,
    removeCreator,
    updateSearchQuery,
    submitCreators,
    clearError,
  };
}
