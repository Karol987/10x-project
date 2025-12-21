// src/components/onboarding/OnboardingPlatformsContainer.tsx

import { useOnboardingPlatforms } from "@/components/hooks/useOnboardingPlatforms";
import { ProgressBar } from "./ProgressBar";
import { PlatformGrid } from "./PlatformGrid";
import { OnboardingFooter } from "./OnboardingFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Main container for the platforms selection onboarding step.
 * Manages state, displays platforms grid, and handles submission.
 */
export function OnboardingPlatformsContainer() {
  const { platforms, selectedPlatformIds, status, errorMessage, togglePlatform, submitSelection } =
    useOnboardingPlatforms();

  const isLoading = status === "loading";
  const isSubmitting = status === "submitting";
  const hasError = status === "error" && !isLoading && !isSubmitting;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8">
          {/* Progress indicator */}
          <ProgressBar currentStep={1} totalSteps={2} />

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Wybierz swoje platformy</h1>
            <p className="text-lg text-muted-foreground">
              Wskaż platformy streamingowe, które subskrybujesz. Dzięki temu pokażemy Ci tylko treści, które możesz
              obejrzeć.
            </p>
          </div>

          {/* Error state */}
          {hasError && (
            <div
              className={cn("p-6 rounded-lg bg-destructive/10 border border-destructive/20", "dark:bg-destructive/20")}
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-destructive">Wystąpił problem</h3>
                  <p className="text-sm text-destructive/90">{errorMessage || "Nie udało się załadować platform"}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
                    Spróbuj ponownie
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platforms grid */}
          {!isLoading && !hasError && (
            <PlatformGrid platforms={platforms} selectedIds={selectedPlatformIds} onToggle={togglePlatform} />
          )}

          {/* Footer with submit button */}
          {!isLoading && !hasError && (
            <OnboardingFooter
              isSubmitDisabled={selectedPlatformIds.size === 0}
              onSubmit={submitSelection}
              isLoading={isSubmitting}
              selectedCount={selectedPlatformIds.size}
              minRequired={1}
            />
          )}
        </div>
      </div>
    </div>
  );
}
