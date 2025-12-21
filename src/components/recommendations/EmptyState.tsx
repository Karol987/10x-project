// src/components/recommendations/EmptyState.tsx
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Empty state component shown when no recommendations are available
 * Suggests user to add more creators or platforms
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <FileQuestion className="size-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Brak rekomendacji</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Nie znaleziono rekomendacji. Spróbuj dodać więcej twórców lub platform do swojego profilu.
      </p>
      <Button asChild>
        <a href="/profile">Edytuj profil</a>
      </Button>
    </div>
  );
}
