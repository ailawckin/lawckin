import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchEmptyStateProps {
  practiceArea: string;
  location: string;
  onClearPracticeArea: () => void;
  onBrowseAll: () => void;
  onNotify: () => void;
}

export function SearchEmptyState({
  practiceArea,
  location,
  onClearPracticeArea,
  onBrowseAll,
  onNotify,
}: SearchEmptyStateProps) {
  return (
    <div className="text-center py-12 max-w-md mx-auto">
      <div className="mb-6">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No lawyers found</h3>
        <p className="text-muted-foreground mb-6">
          {practiceArea && location ? (
            <>
              We couldn't find any lawyers matching <strong>"{practiceArea}"</strong> in{
              " "}
              <strong>{location}</strong>.
            </>
          ) : practiceArea ? (
            <>
              We couldn't find any lawyers matching <strong>"{practiceArea}"</strong>.
            </>
          ) : location ? (
            <>
              We couldn't find any lawyers in <strong>{location}</strong>.
            </>
          ) : (
            <>No lawyers found matching your criteria.</>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {location && (
          <Button onClick={onClearPracticeArea} variant="default" className="w-full">
            Show all lawyers in {location}
          </Button>
        )}

        <Button onClick={onBrowseAll} variant="outline" className="w-full">
          Browse all lawyers
        </Button>

        <Button onClick={onNotify} variant="ghost" className="w-full">
          Get notified when we find matches
        </Button>
      </div>
    </div>
  );
}
