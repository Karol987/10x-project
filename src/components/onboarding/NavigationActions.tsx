// src/components/onboarding/NavigationActions.tsx

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationActionsProps {
  isValid: boolean;
  onFinish: () => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

/**
 * Footer navigation with submit button
 * Handles validation, loading states, and error display
 */
export function NavigationActions({ isValid, onFinish, isSubmitting, errorMessage }: NavigationActionsProps) {
  return (
    <div className="space-y-4">
      {/* Error message */}
      {errorMessage && (
        <div
          className={cn(
            "p-4 rounded-md bg-destructive/10 border border-destructive/20",
            "text-sm text-destructive dark:bg-destructive/20"
          )}
          role="alert"
          aria-live="assertive"
        >
          {errorMessage}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Helper text */}
        <p className="text-sm text-muted-foreground">
          {isValid ? "Gotowe! Możesz zakończyć" : "Wybierz co najmniej 3 twórców"}
        </p>

        {/* Submit button */}
        <Button
          onClick={onFinish}
          disabled={!isValid || isSubmitting}
          size="lg"
          className="min-w-[140px]"
          aria-label={isSubmitting ? "Zapisywanie..." : "Zakończ onboarding"}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Zapisywanie...</span>
            </>
          ) : (
            "Zakończ"
          )}
        </Button>
      </div>
    </div>
  );
}
