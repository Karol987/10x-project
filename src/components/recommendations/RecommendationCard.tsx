// src/components/recommendations/RecommendationCard.tsx
import { memo } from "react";
import type { RecommendationViewModel } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface RecommendationCardProps {
  item: RecommendationViewModel;
  onWatched: (id: string) => void;
  isMarking?: boolean;
}

/**
 * Card component displaying a single movie/series recommendation
 * Shows poster, title, year, media type, associated creators, and platforms
 */
export const RecommendationCard = memo(function RecommendationCard({
  item,
  onWatched,
  isMarking = false,
}: RecommendationCardProps) {
  const handleWatchedClick = () => {
    onWatched(item.id);
  };

  // Don't render if optimistically hidden
  if (item.isOptimisticallyHidden) {
    return null;
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-opacity hover:shadow-md">
      {/* Poster Image */}
      {item.poster_path && (
        <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
          <img src={item.poster_path} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}

      <CardHeader>
        <CardTitle className="line-clamp-2">{item.title}</CardTitle>
        <CardDescription>
          {item.year && <span className="font-medium">{item.year}</span>}
          {item.year && item.media_type && <span className="mx-2">•</span>}
          {item.media_type && <span className="capitalize">{item.media_type === "movie" ? "Film" : "Serial"}</span>}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Platforms */}
        {item.platforms && item.platforms.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Dostępne na:</p>
            <div className="flex flex-wrap gap-2">
              {item.platforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="capitalize">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Creators */}
        {item.creators && item.creators.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Twórcy:</p>
            <div className="flex flex-wrap gap-2">
              {item.creators.map((creator) => (
                <Badge key={creator.id} variant={creator.is_favorite ? "default" : "outline"} className="gap-1.5">
                  <span>{creator.name}</span>
                  {creator.creator_role && (
                    <span className="text-[10px] opacity-70">
                      ({creator.creator_role === "actor" ? "aktor" : "reżyser"})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleWatchedClick}
          disabled={isMarking}
          variant="outline"
          className="w-full"
          aria-label="Oznacz jako obejrzane"
        >
          <Eye className="size-4" />
          {isMarking ? "Zapisywanie..." : "Oznacz jako obejrzane"}
        </Button>
      </CardFooter>
    </Card>
  );
});
