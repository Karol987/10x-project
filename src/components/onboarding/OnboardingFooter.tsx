// src/components/onboarding/OnboardingFooter.tsx

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface OnboardingFooterProps {
  isSubmitDisabled: boolean;
  onSubmit: () => void;
  isLoading: boolean;
  selectedCount?: number;
  minRequired?: number;
}

/**
 * Footer component for onboarding steps with submit button.
 * Displays validation state, helper text, and handles submission.
 */
export function OnboardingFooter({
  isSubmitDisabled,
  onSubmit,
  isLoading,
  selectedCount = 0,
  minRequired = 1,
}: OnboardingFooterProps) {
  const isValid = selectedCount >= minRequired;

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Helper text */}
        <p className="text-sm text-muted-foreground">
          {isValid
            ? `Wybrano: ${selectedCount} ${selectedCount === 1 ? "platforma" : selectedCount < 5 ? "platformy" : "platform"}`
            : `Wybierz co najmniej ${minRequired} ${minRequired === 1 ? "platformę" : "platformy"}`}
        </p>

        {/* Submit button */}
        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled || isLoading}
          size="lg"
          className="min-w-[140px]"
          aria-label={isLoading ? "Zapisywanie..." : "Przejdź dalej"}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Zapisywanie...</span>
            </>
          ) : (
            "Dalej"
          )}
        </Button>
      </div>
    </div>
  );
}
