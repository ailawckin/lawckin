export function SearchScoreInfoPanel() {
  return (
    <div className="mb-6 p-4 bg-muted/50 rounded-lg text-sm">
      <p className="mb-2 font-medium">Match scores are calculated based on:</p>
      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
        <li>Practice Area & Specific Issue Match</li>
        <li>Location & Language Fit</li>
        <li>Budget Range Alignment</li>
        <li>AI Keyword Relevance (if provided)</li>
        <li>Availability Timing (urgency-sensitive)</li>
        <li>Rating & Review Volume</li>
        <li>Fair Exposure Boost for new lawyers</li>
      </ul>
    </div>
  );
}
