import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SearchResultsHeader } from "@/components/search/SearchResultsHeader";
import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel";
import { SearchResultsSummary } from "@/components/search/SearchResultsSummary";
import { SearchScoreInfoPanel } from "@/components/search/SearchScoreInfoPanel";
import { SearchResultsGrid } from "@/components/search/SearchResultsGrid";
import { SearchPagination } from "@/components/search/SearchPagination";
import { SearchEmptyState } from "@/components/search/SearchEmptyState";
import { useSearchResults } from "@/hooks/useSearchResults";

const SearchResults = () => {
  const {
    practiceArea,
    location,
    selectedLocations,
    budget,
    specificIssue,
    aiMatch,
    topMatches,
    loading,
    currentPage,
    totalPages,
    paginatedLawyers,
    totalResults,
    sortBy,
    showFilters,
    showScoreInfo,
    filters,
    setLocationFilter,
    setSortBy,
    setShowFilters,
    setShowScoreInfo,
    setFilters,
    setCurrentPage,
    applyFilters,
    clearPracticeArea,
    browseAllLawyers,
    notifyOnMatches,
  } = useSearchResults();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-20 px-4">
        <div className="container mx-auto">
          <SearchResultsHeader
            practiceArea={practiceArea}
            location={location}
            selectedLocations={selectedLocations}
            onLocationChange={setLocationFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((prev) => !prev)}
          />

          {showFilters && (
            <SearchFiltersPanel filters={filters} onChange={setFilters} onApply={applyFilters} />
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : totalResults === 0 ? (
            <SearchEmptyState
              practiceArea={practiceArea}
              location={location}
              onClearPracticeArea={clearPracticeArea}
              onBrowseAll={browseAllLawyers}
              onNotify={notifyOnMatches}
            />
          ) : (
            <>
              <SearchResultsSummary
                total={totalResults}
                showScoreInfo={showScoreInfo}
                onToggleScoreInfo={() => setShowScoreInfo((prev) => !prev)}
                aiMatch={aiMatch}
              />

              {showScoreInfo && <SearchScoreInfoPanel />}

              <SearchResultsGrid
                topLawyers={topMatches}
                moreLawyers={paginatedLawyers}
                practiceArea={practiceArea}
                location={location}
                budget={budget}
                specificIssue={specificIssue}
              />

              <SearchPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SearchResults;
