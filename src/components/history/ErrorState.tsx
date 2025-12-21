// src/components/history/ErrorState.tsx
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

/**
 * Error state component shown when fetching history fails
 * Provides a retry button to attempt fetching again
 */
export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="size-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold mb-2">WystÄ…piĹ‚ problem</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Nie udało się pobrać historii obejrzanych produkcji. Sprawdź połączenie internetowe i spróbuj ponownie.
      </p>
      <Button onClick={onRetry} variant="default">
        SprĂłbuj ponownie
      </Button>
    </div>
  );
}
