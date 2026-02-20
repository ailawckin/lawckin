import LawyerCard from "@/components/LawyerCard";
import {
  formatPracticeAreaLabel,
  getDisplayPracticeArea,
  getPrimaryLocation,
} from "@/lib/lawyerDisplay";
import type { LawyerSearchResult } from "@/hooks/useSearchResults";

interface SearchResultsGridProps {
  topLawyers: LawyerSearchResult[];
  moreLawyers: LawyerSearchResult[];
  practiceArea: string;
  location: string;
  budget: string;
  specificIssue: string;
}

const getRatingScore = (rating?: number | null) => {
  if (!rating) return 0;
  if (rating >= 4.5) return 10;
  if (rating >= 4.0) return 7;
  if (rating >= 3.5) return 5;
  return 2;
};

const MatchScoreBadge = ({
  matchScore,
  practiceArea,
  location,
  budget,
  specificIssue,
  rating,
}: {
  matchScore?: number | null;
  practiceArea: string;
  location: string;
  budget: string;
  specificIssue: string;
  rating?: number | null;
}) => {
  if (matchScore === null || matchScore === undefined) return null;

  const isExcellent = matchScore >= 70;
  const ratingScore = getRatingScore(rating);

  return (
    <div className="absolute top-2 right-2 z-10 group">
      <div
        className={`px-3 py-1 text-white text-xs font-semibold rounded-full shadow-md cursor-help ${
          isExcellent ? "bg-green-500" : "bg-blue-500"
        }`}
      >
        {matchScore}% Match
      </div>
      <div className="absolute right-0 top-full mt-2 w-56 bg-popover text-popover-foreground p-3 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-xs border z-20">
        <div className="font-semibold mb-2">Match Breakdown:</div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Practice Area:</span>
            <span className={practiceArea ? "text-green-600 font-medium" : "text-gray-400"}>
              {practiceArea ? "40 pts" : "0 pts"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location:</span>
            <span className={location ? "text-green-600 font-medium" : "text-gray-400"}>
              {location ? "20 pts" : "0 pts"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Budget:</span>
            <span
              className={
                budget && budget !== "No preference" ? "text-green-600 font-medium" : "text-gray-400"
              }
            >
              {budget && budget !== "No preference" ? "15 pts" : "0 pts"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Specific Issue:</span>
            <span className={specificIssue ? "text-green-600 font-medium" : "text-gray-400"}>
              {specificIssue ? "15 pts" : "0 pts"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rating:</span>
            <span className={rating ? "text-green-600 font-medium" : "text-gray-400"}>
              {ratingScore ? `${ratingScore} pts` : "0 pts"}
            </span>
          </div>
          <div className="border-t pt-1.5 mt-1.5 flex justify-between font-semibold">
            <span>Total:</span>
            <span>{matchScore} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function SearchResultsGrid({
  topLawyers,
  moreLawyers,
  practiceArea,
  location,
  budget,
  specificIssue,
}: SearchResultsGridProps) {
  const moreLabel = practiceArea ? `More ${practiceArea} lawyers` : "More lawyers";
  const moreDescription = practiceArea
    ? "More lawyers in this practice area."
    : "Additional lawyers you may want to explore.";

  return (
    <div className="space-y-10 mb-8">
      {topLawyers.length > 0 && (
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Top matches</h3>
            <p className="text-sm text-muted-foreground">
              Best fit for your criteria.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topLawyers.map((lawyer) => {
              const displayArea = getDisplayPracticeArea(lawyer, practiceArea);
              return (
                <div key={lawyer.id} className="relative">
                  <MatchScoreBadge
                    matchScore={lawyer.match_score}
                    practiceArea={practiceArea}
                    location={location}
                    budget={budget}
                    specificIssue={specificIssue}
                    rating={lawyer.rating}
                  />
                  <LawyerCard
                    id={lawyer.id}
                    name={lawyer.full_name || "Unknown"}
                    specialty={displayArea.area}
                    practiceAreaDisplay={formatPracticeAreaLabel(displayArea.area, displayArea.years)}
                    location={getPrimaryLocation(lawyer)}
                    experience={`${lawyer.experience_years} years experience`}
                    rating={lawyer.rating || 0}
                    reviews={lawyer.total_reviews || 0}
                    image={
                      lawyer.avatar_url ||
                      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop"
                    }
                    hourlyRate={lawyer.hourly_rate}
                    firmName={lawyer.firm_name}
                    languages={lawyer.languages}
                    nextAvailableAt={(lawyer as any).next_available_at || null}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {moreLawyers.length > 0 && (
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{moreLabel}</h3>
            <p className="text-sm text-muted-foreground">{moreDescription}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moreLawyers.map((lawyer) => {
              const displayArea = getDisplayPracticeArea(lawyer, practiceArea);
              return (
                <div key={lawyer.id} className="relative">
                  <LawyerCard
                    id={lawyer.id}
                    name={lawyer.full_name || "Unknown"}
                    specialty={displayArea.area}
                    practiceAreaDisplay={formatPracticeAreaLabel(displayArea.area, displayArea.years)}
                    location={getPrimaryLocation(lawyer)}
                    experience={`${lawyer.experience_years} years experience`}
                    rating={lawyer.rating || 0}
                    reviews={lawyer.total_reviews || 0}
                    image={
                      lawyer.avatar_url ||
                      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop"
                    }
                    hourlyRate={lawyer.hourly_rate}
                    firmName={lawyer.firm_name}
                    languages={lawyer.languages}
                    nextAvailableAt={(lawyer as any).next_available_at || null}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
