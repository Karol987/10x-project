// src/components/onboarding/OnboardingCreatorsContainer.tsx

import { useCreatorSelection } from "../hooks/useCreatorSelection";
import { ProgressBar } from "./ProgressBar";
import { CreatorSearch } from "./CreatorSearch";
import { SelectedCreatorsList } from "./SelectedCreatorsList";
import { NavigationActions } from "./NavigationActions";

/**
 * Main container for the onboarding creators selection flow
 * Manages state and orchestrates all child components
 */
export function OnboardingCreatorsContainer() {
  const {
    selectedCreators,
    searchQuery,
    searchResults,
    isValid,
    isSubmitting,
    isSearching,
    errorMessage,
    addCreator,
    removeCreator,
    updateSearchQuery,
    submitCreators,
  } = useCreatorSelection();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-8">
          {/* Progress indicator */}
          <ProgressBar currentStep={2} totalSteps={2} />

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Wybierz ulubionych twórców</h1>
            <p className="text-muted-foreground">
              Dodaj co najmniej 3 aktorów lub reżyserów, których filmy i seriale chcesz oglądać. Pomoże nam to polecać
              Ci najlepsze tytuły.
            </p>
          </div>

          {/* Search section */}
          <div className="space-y-4">
            <label htmlFor="creator-search" className="text-sm font-medium text-foreground">
              Wyszukaj twórców
            </label>
            <div id="creator-search">
              <CreatorSearch
                searchQuery={searchQuery}
                onSearchChange={updateSearchQuery}
                searchResults={searchResults}
                onSelect={addCreator}
                isSearching={isSearching}
              />
            </div>
          </div>

          {/* Selected creators */}
          <SelectedCreatorsList creators={selectedCreators} onRemove={removeCreator} minRequired={3} />

          {/* Navigation */}
          <NavigationActions
            isValid={isValid}
            onFinish={submitCreators}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        </div>
      </div>
    </div>
  );
}
