// src/components/hooks/useOnboardingPlatforms.ts

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { PlatformDTO, UUID } from "@/types";

interface UseOnboardingPlatformsReturn {
  platforms: PlatformDTO[];
  selectedPlatformIds: Set<UUID>;
  status: "idle" | "loading" | "submitting" | "error";
  errorMessage: string | null;
  togglePlatform: (id: UUID) => void;
  submitSelection: () => Promise<void>;
}

/**
 * Custom hook for managing platform selection during onboarding.
 * Handles fetching platforms, managing selection state, and submitting to API.
 *
 * @returns Object containing platforms data, selection state, and control functions
 */
export function useOnboardingPlatforms(): UseOnboardingPlatformsReturn {
  const [platforms, setPlatforms] = useState<PlatformDTO[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<UUID>>(new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Fetch all available platforms from the API
   */
  useEffect(() => {
    const fetchPlatforms = async () => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/platforms");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać listy platform");
        }

        const data: PlatformDTO[] = await response.json();
        setPlatforms(data);
        setStatus("idle");
      } catch (error) {
        setStatus("error");
        // Handle network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
          const message = "Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie.";
          setErrorMessage(message);
          toast.error(message);
        } else {
          const message = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd podczas pobierania platform";
          setErrorMessage(message);
          toast.error(message);
        }
      }
    };

    fetchPlatforms();
  }, []);

  /**
   * Toggle platform selection state
   * Adds platform ID if not selected, removes if already selected
   */
  const togglePlatform = useCallback((id: UUID) => {
    setSelectedPlatformIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  /**
   * Submit selected platforms to the API
   * On success, redirects to the next onboarding step
   */
  const submitSelection = useCallback(async () => {
    // Validation: at least 1 platform required
    if (selectedPlatformIds.size === 0) {
      const message = "Musisz wybrać co najmniej jedną platformę";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    // Validation: maximum 50 platforms
    if (selectedPlatformIds.size > 50) {
      const message = "Możesz wybrać maksymalnie 50 platform";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/onboarding/platforms", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform_ids: Array.from(selectedPlatformIds),
        }),
      });

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 401) {
          const message = "Sesja wygasła. Zaloguj się ponownie.";
          toast.error(message);
          // Redirect to login after short delay
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          throw new Error(message);
        }

        if (response.status === 422) {
          const errorData = await response.json();
          const message = errorData.error || "Nieprawidłowe dane";
          toast.error(message);
          throw new Error(message);
        }

        const message = "Wystąpił problem podczas zapisywania Twoich wyborów. Spróbuj ponownie.";
        toast.error(message);
        throw new Error(message);
      }

      // Success - show toast and redirect
      toast.success("Platformy zapisane pomyślnie!");
      // Small delay to show success message
      setTimeout(() => {
        window.location.href = "/onboarding/creators";
      }, 500);
    } catch (error) {
      setStatus("error");
      const message = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd podczas zapisywania";
      setErrorMessage(message);
      // Network error handling
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkMessage = "Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie.";
        setErrorMessage(networkMessage);
        toast.error(networkMessage);
      }
    }
  }, [selectedPlatformIds]);

  return {
    platforms,
    selectedPlatformIds,
    status,
    errorMessage,
    togglePlatform,
    submitSelection,
  };
}
