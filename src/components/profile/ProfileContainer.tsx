// src/components/profile/ProfileContainer.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useProfilePreferences } from "../hooks/useProfilePreferences";
import { ThemeToggle } from "./ThemeToggle";
import { PlatformGrid } from "./PlatformGrid";
import { CreatorSearch } from "./CreatorSearch";
import { CreatorList } from "./CreatorList";
import { Loader2, History } from "lucide-react";
import { Button } from "../ui/button";
import type { CreatorDTO } from "@/types";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Main container for Profile view
 * Manages state and coordinates data flow between sections
 */
function ProfileContent() {
  const {
    allPlatforms,
    userPlatforms,
    userCreators,
    isLoading,
    isLoadingPlatforms,
    isLoadingCreators,
    error,
    updatePlatforms,
    addCreator,
    removeCreator,
    isUpdatingPlatforms,
  } = useProfilePreferences();

  const [removingCreatorId, setRemovingCreatorId] = useState<string | null>(null);

  // Extract platform IDs for easier handling
  const selectedPlatformIds = userPlatforms.map((p) => p.id);
  const excludedCreatorIds = userCreators.map((c) => c.id);

  const handlePlatformToggle = (newPlatformIds: string[]) => {
    updatePlatforms(newPlatformIds);
  };

  const handleCreatorAdd = (creator: CreatorDTO) => {
    addCreator(creator);
  };

  const handleCreatorRemove = (creatorId: string) => {
    setRemovingCreatorId(creatorId);
    removeCreator(creatorId);
    // Reset after a short delay
    setTimeout(() => setRemovingCreatorId(null), 1000);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-test-id="profile-loading">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Ładowanie preferencji...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-test-id="profile-error">
        <div className="text-center space-y-2 max-w-md">
          <p className="text-lg font-medium text-destructive">Wystąpił błąd</p>
          <p className="text-sm text-muted-foreground">
            Nie udało się załadować Twoich preferencji. Spróbuj odświeżyć stronę.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12" data-test-id="profile-container">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-test-id="profile-title">
          Profil
        </h1>
        <p className="text-muted-foreground">Zarządzaj swoimi preferencjami i ustawieniami aplikacji</p>
      </div>

      {/* Theme Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Wygląd</h2>
          <p className="text-sm text-muted-foreground">Dostosuj wygląd aplikacji do swoich preferencji</p>
        </div>
        <ThemeToggle />
      </section>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Platforms Section */}
      <section data-testid="platforms-section" data-test-id="platforms-section" className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold" data-test-id="platforms-section-title">
            Platformy VOD
          </h2>
          <p className="text-sm text-muted-foreground">
            Wybierz platformy, z których korzystasz. Musisz wybrać co najmniej jedną platformę.
          </p>
        </div>
        <PlatformGrid
          allPlatforms={allPlatforms}
          selectedPlatformIds={selectedPlatformIds}
          onToggle={handlePlatformToggle}
          isLoading={isLoadingPlatforms}
          isPending={isUpdatingPlatforms}
        />
      </section>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Creators Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Ulubieni twórcy</h2>
          <p className="text-sm text-muted-foreground">
            Dodaj aktorów i reżyserów, których lubisz. Im więcej wybierzesz, tym lepsze będą rekomendacje.
          </p>
        </div>

        {/* Search */}
        <CreatorSearch excludeIds={excludedCreatorIds} onSelect={handleCreatorAdd} />

        {/* List */}
        <CreatorList
          creators={userCreators}
          onRemove={handleCreatorRemove}
          isLoading={isLoadingCreators}
          removingCreatorId={removingCreatorId || undefined}
        />
      </section>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Watched History Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Obejrzane</h2>
          <p className="text-sm text-muted-foreground">Przeglądaj filmy i seriale, które oznaczyłeś jako obejrzane</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => (window.location.href = "/history")}>
          <History className="h-4 w-4 mr-2" />
          Zobacz historię obejrzanych
        </Button>
      </section>
    </div>
  );
}

/**
 * Wrapper component that provides QueryClient context
 */
export function ProfileContainer() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileContent />
    </QueryClientProvider>
  );
}
