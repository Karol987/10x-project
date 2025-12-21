// src/components/history/EmptyHistoryState.tsx
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Empty state component shown when user has no watched items
 * Suggests user to browse recommendations and mark items as watched
 */
export function EmptyHistoryState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <History className="size-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Brak historii</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Nie masz jeszcze żadnych obejrzanych produkcji. Przejdź do rekomendacji i zacznij oznaczać filmy i seriale jako
        obejrzane.
      </p>
      <Button asChild>
        <a href="/home">Przeglądaj rekomendacje</a>
      </Button>
    </div>
  );
}
