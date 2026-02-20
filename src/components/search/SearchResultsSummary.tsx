import { Info } from "lucide-react";

interface SearchResultsSummaryProps {
  total: number;
  showScoreInfo: boolean;
  onToggleScoreInfo: () => void;
  aiMatch?: boolean;
}

export function SearchResultsSummary({
  total,
  showScoreInfo,
  onToggleScoreInfo,
  aiMatch,
}: SearchResultsSummaryProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <p className="text-muted-foreground">
          Found {total} {total === 1 ? "lawyer" : "lawyers"}
        </p>
        {aiMatch ? (
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            AI matched
          </span>
        ) : null}
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={onToggleScoreInfo}
          aria-label={showScoreInfo ? "Hide match score info" : "About match scores"}
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
