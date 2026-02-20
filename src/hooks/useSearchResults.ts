import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getLocations, getPracticeAreas } from "@/lib/lawyerDisplay";
import { getPracticeAreaSearchTerm, practiceAreaMatches } from "@/lib/practiceAreaMatch";

export type SearchSortOption = "relevance" | "rating" | "price";

export type SearchFilters = {
  minExperience: string;
  minRating: string;
  languages: string;
};

export type LawyerSearchResult = {
  id: string;
  full_name?: string | null;
  experience_years?: number | null;
  rating?: number | null;
  total_reviews?: number | null;
  avatar_url?: string | null;
  hourly_rate?: number | null;
  firm_name?: string | null;
  match_score?: number | null;
  languages?: string[] | null;
  practice_areas?: string[] | null;
  specialty?: string | null;
  ny_locations?: string[] | null;
  location?: string | null;
  next_available_at?: string | null;
  expertise_areas?: { area?: string; years?: number | null }[] | null;
};

const LAWYERS_PER_PAGE = 12;
const TOP_MATCHES_COUNT = 6;

const SORT_OPTIONS: SearchSortOption[] = ["relevance", "rating", "price"];

const isSortOption = (value: string | null): value is SearchSortOption =>
  value !== null && SORT_OPTIONS.includes(value as SearchSortOption);

const parseBudgetRange = (budget: string) => {
  if (!budget) {
    return { minRate: null as number | null, maxRate: null as number | null };
  }

  const budgetMap: Record<string, [number | null, number | null]> = {
    "Under $150/hr": [null, 150],
    "$150–$250/hr": [150, 250],
    "$250–$400/hr": [250, 400],
    "$400–$600/hr": [400, 600],
    "$600+/hr": [600, null],
    "No preference": [null, null],
  };

  const [minRate, maxRate] = budgetMap[budget] || [null, null];
  return { minRate, maxRate };
};

const applyClientSideFilters = (lawyers: LawyerSearchResult[], filters: SearchFilters) => {
  let filtered = lawyers;

  if (filters.minExperience) {
    const minExp = Number.parseInt(filters.minExperience, 10);
    filtered = filtered.filter((lawyer) => (lawyer.experience_years || 0) >= minExp);
  }

  if (filters.minRating) {
    const minRat = Number.parseFloat(filters.minRating);
    filtered = filtered.filter((lawyer) => (lawyer.rating || 0) >= minRat);
  }

  return filtered;
};

const applyPracticeAreaFilter = (
  lawyers: LawyerSearchResult[],
  practiceAreaQuery: string
) => {
  if (!practiceAreaQuery) return lawyers;
  return lawyers.filter((lawyer) =>
    practiceAreaMatches(practiceAreaQuery, getPracticeAreas(lawyer))
  );
};

const normalizeCsvValues = (raw: string) => {
  if (!raw) return [] as string[];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of raw.split(",")) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
};

const dedupeLawyers = (lawyers: LawyerSearchResult[]) => {
  const seen = new Set<string>();
  return lawyers.filter((lawyer) => {
    if (!lawyer.id || seen.has(lawyer.id)) return false;
    seen.add(lawyer.id);
    return true;
  });
};

const sortLawyers = (lawyers: LawyerSearchResult[], sortBy: SearchSortOption) => {
  if (sortBy === "rating") {
    return [...lawyers].sort((a, b) =>
      (b.rating || 0) - (a.rating || 0) ||
      (b.total_reviews || 0) - (a.total_reviews || 0) ||
      (b.experience_years || 0) - (a.experience_years || 0)
    );
  }

  if (sortBy === "price") {
    return [...lawyers].sort((a, b) =>
      (a.hourly_rate || 999999) - (b.hourly_rate || 999999) ||
      (b.rating || 0) - (a.rating || 0) ||
      (b.total_reviews || 0) - (a.total_reviews || 0)
    );
  }

  return [...lawyers].sort((a, b) =>
    (b.match_score || 0) - (a.match_score || 0) ||
    (b.rating || 0) - (a.rating || 0) ||
    (b.total_reviews || 0) - (a.total_reviews || 0) ||
    (b.experience_years || 0) - (a.experience_years || 0)
  );
};

export const useSearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const practiceArea = searchParams.get("practice_area") || "";
  const practiceAreaQuery = useMemo(
    () => (practiceArea ? getPracticeAreaSearchTerm(practiceArea) : ""),
    [practiceArea]
  );
  const locationParam = searchParams.get("location") || "";
  const locationsParam = searchParams.get("locations") || "";
  const locationTokens = useMemo(
    () =>
      locationsParam
        ? locationsParam.split(",").map((value) => value.trim()).filter(Boolean)
        : locationParam
          ? [locationParam]
          : [],
    [locationParam, locationsParam]
  );
  const location = locationTokens.join(", ");
  const budget = searchParams.get("budget") || "";
  const specificIssue = searchParams.get("specific_issue") || "";
  const languages = searchParams.get("languages") || "";
  const keywords = searchParams.get("keywords") || "";
  const urgency = searchParams.get("urgency") || "";
  const aiMatch = searchParams.get("ai") === "true";
  const searchId = searchParams.get("search_id") || "";

  const [primaryLawyers, setPrimaryLawyers] = useState<LawyerSearchResult[]>([]);
  const [secondaryLawyers, setSecondaryLawyers] = useState<LawyerSearchResult[]>([]);
  const matchedSaveRef = useRef<{ id: string; saved: boolean }>({ id: "", saved: false });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SearchSortOption>(() => {
    const sortParam = searchParams.get("sort");
    return isSortOption(sortParam) ? sortParam : "relevance";
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    minExperience: "",
    minRating: "",
    languages: languages || "",
  });

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (languages !== filtersRef.current.languages) {
      setFilters((prev) => ({ ...prev, languages }));
    }
  }, [languages]);

  const fetchMatchingLawyers = useCallback(
    async (activeFilters: SearchFilters) => {
      setLoading(true);

      try {
        const { minRate, maxRate } = parseBudgetRange(budget);
        const locationArray = locationTokens.length > 0 ? locationTokens : null;
        const primaryLocation = locationTokens[0] || locationParam || null;

        const urlLanguages = normalizeCsvValues(languages);
        const filterLanguagesArray = normalizeCsvValues(activeFilters.languages);
        const combinedLanguages = [...new Set([...urlLanguages, ...filterLanguagesArray].map((v) => v.toLowerCase()))];
        const languageArray = combinedLanguages.length > 0 ? combinedLanguages : null;

        let data: LawyerSearchResult[] = [];
        let shouldFallback = false;
        let searchFromMissing = false;
        let advancedMissing = false;
        const keywordArray = normalizeCsvValues(keywords)
          .map((keyword) => keyword.toLowerCase())
          .filter((keyword) => keyword.length >= 2);

        if (searchId) {
          try {
            const result = await supabase.rpc("search_lawyers_from_search", {
              p_search_id: searchId,
              p_limit: LAWYERS_PER_PAGE * 3,
            });

            if (result.error) {
              if (
                result.error.message.includes("Could not find the function") ||
                result.error.message.includes("does not exist")
              ) {
                searchFromMissing = true;
              } else {
                throw result.error;
              }
            } else {
              data = (result.data || []) as LawyerSearchResult[];
            }
          } catch (rpcError: unknown) {
            const message = rpcError instanceof Error ? rpcError.message : "";
            if (message.includes("Could not find the function") || message.includes("does not exist")) {
              searchFromMissing = true;
            } else {
              throw rpcError;
            }
          }
        }

        if (!searchId || searchFromMissing) {
          try {
            const result = await supabase.rpc("search_lawyers_advanced", {
              p_practice_area: practiceAreaQuery || null,
              p_location: primaryLocation,
              p_locations: locationArray,
              p_min_rate: minRate,
              p_max_rate: maxRate,
              p_specific_issue: specificIssue || null,
              p_languages: languageArray,
              p_keywords: keywordArray.length > 0 ? keywordArray : null,
              p_urgency: urgency || null,
              p_limit: LAWYERS_PER_PAGE * 3,
            });

            if (result.error) {
              if (
                result.error.message.includes("Could not find the function") ||
                result.error.message.includes("does not exist")
              ) {
                advancedMissing = true;
              } else {
                throw result.error;
              }
            } else {
              data = (result.data || []) as LawyerSearchResult[];
            }
          } catch (rpcError: unknown) {
            const message = rpcError instanceof Error ? rpcError.message : "";
            if (message.includes("Could not find the function") || message.includes("does not exist")) {
              advancedMissing = true;
            } else {
              throw rpcError;
            }
          }
        }

        if (advancedMissing) {
          try {
            const result = await supabase.rpc("search_lawyers", {
              p_practice_area: practiceAreaQuery || null,
              p_location: primaryLocation,
              p_min_rate: minRate,
              p_max_rate: maxRate,
              p_specific_issue: specificIssue || null,
              p_languages: languageArray,
              p_limit: LAWYERS_PER_PAGE * 3,
            });

            if (result.error) {
              if (
                result.error.message.includes("Could not find the function") ||
                result.error.message.includes("does not exist")
              ) {
                shouldFallback = true;
              } else {
                throw result.error;
              }
            } else {
              data = (result.data || []) as LawyerSearchResult[];
            }
          } catch (rpcError: unknown) {
            const message = rpcError instanceof Error ? rpcError.message : "";
            if (message.includes("Could not find the function") || message.includes("does not exist")) {
              shouldFallback = true;
            } else {
              throw rpcError;
            }
          }
        }

        if (shouldFallback) {
          if (practiceAreaQuery) {
            data = [];
            toast({
              title: "Search unavailable",
              description: "Strict practice-area search is required. Please try again later.",
              variant: "default",
            });
          } else {
            const { data: allLawyers, error: listError } = await supabase.rpc("get_lawyers_list");
            if (listError) throw listError;

            let filteredLawyers = (allLawyers || []) as LawyerSearchResult[];

            if (locationTokens.length > 0) {
              const normalizedLocations = locationTokens.map((value) => value.toLowerCase());
              filteredLawyers = filteredLawyers.filter((lawyer) =>
                getLocations(lawyer).some((loc) =>
                  normalizedLocations.some((query) => loc.toLowerCase().includes(query))
                )
              );
            }

            if (minRate !== null || maxRate !== null) {
              filteredLawyers = filteredLawyers.filter((lawyer) => {
                if (!lawyer.hourly_rate) return false;
                if (minRate !== null && lawyer.hourly_rate < minRate) return false;
                if (maxRate !== null && lawyer.hourly_rate > maxRate) return false;
                return true;
              });
            }

            filteredLawyers = applyClientSideFilters(filteredLawyers, activeFilters);

            if (languageArray && languageArray.length > 0) {
              filteredLawyers = filteredLawyers.filter((lawyer) => {
                if (!lawyer.languages || !Array.isArray(lawyer.languages)) return false;
                return languageArray.some((lang) =>
                  lawyer.languages?.some((language) =>
                    language.toLowerCase().includes(lang.toLowerCase())
                  )
                );
              });
            }

            data = filteredLawyers.map((lawyer) => ({
              ...lawyer,
              match_score: lawyer.match_score || 50,
            }));
          }
        }

        if (data.length > 0) {
          data = applyClientSideFilters(data, activeFilters);
          if (languageArray && languageArray.length > 0) {
            data = data.filter((lawyer) => {
              if (!lawyer.languages || !Array.isArray(lawyer.languages)) return false;
              return languageArray.some((lang) =>
                lawyer.languages?.some((language) =>
                  language.toLowerCase().includes(lang)
                )
              );
            });
          }
          data = applyPracticeAreaFilter(data, practiceAreaQuery);
          data = dedupeLawyers(data);
        }

        setPrimaryLawyers(data);

        if (data.length > 0) {
          const avgScore = data.reduce((sum, lawyer) => sum + (lawyer.match_score || 0), 0) / data.length;
          if (avgScore >= 70) {
            toast({
              title: "Excellent matches found!",
              description: `${data.length} highly relevant lawyers match your criteria.`,
            });
          } else if (avgScore >= 50) {
            toast({
              title: "Good matches found",
              description: `${data.length} lawyers match your criteria.`,
            });
          }
        } else if (practiceArea || location) {
          toast({
            title: "No exact matches found",
            description: "Try adjusting your search criteria or browse all lawyers.",
            variant: "default",
          });
        }

        let secondaryResults: LawyerSearchResult[] = [];

        if (practiceAreaQuery) {
          try {
            const secondary = await supabase.rpc("search_lawyers_advanced", {
              p_practice_area: practiceAreaQuery,
              p_location: null,
              p_locations: null,
              p_min_rate: null,
              p_max_rate: null,
              p_specific_issue: null,
              p_languages: null,
              p_keywords: null,
              p_urgency: null,
              p_limit: LAWYERS_PER_PAGE * 5,
            });

            if (secondary.error) {
              if (
                secondary.error.message.includes("Could not find the function") ||
                secondary.error.message.includes("does not exist")
              ) {
                throw secondary.error;
              } else {
                throw secondary.error;
              }
            } else {
              secondaryResults = (secondary.data || []) as LawyerSearchResult[];
            }
          } catch {
            secondaryResults = [];
          }
        } else {
          try {
            const { data: allLawyers, error: listError } = await supabase.rpc("get_lawyers_list");
            if (listError) throw listError;
            secondaryResults = (allLawyers || []) as LawyerSearchResult[];
          } catch {
            secondaryResults = [];
          }
        }

        secondaryResults = applyPracticeAreaFilter(secondaryResults, practiceAreaQuery);
        setSecondaryLawyers(dedupeLawyers(secondaryResults));
      } catch (error: unknown) {
        toast({
          title: "Error loading results",
          description: error instanceof Error ? error.message : "Something went wrong.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      budget,
      languages,
      location,
      locationParam,
      locationTokens,
      practiceArea,
      practiceAreaQuery,
      specificIssue,
      keywords,
      urgency,
      searchId,
      toast,
    ]
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchMatchingLawyers(filtersRef.current);
  }, [budget, languages, location, practiceArea, specificIssue, keywords, urgency, fetchMatchingLawyers]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (sortBy !== "relevance") {
      params.set("sort", sortBy);
    } else {
      params.delete("sort");
    }
    navigate(`/search-results?${params.toString()}`, { replace: true });
  }, [navigate, searchParams, sortBy]);

  const sortedPrimary = useMemo(() => sortLawyers(primaryLawyers, sortBy), [primaryLawyers, sortBy]);
  const sortedSecondary = useMemo(
    () => sortLawyers(secondaryLawyers, sortBy),
    [secondaryLawyers, sortBy]
  );
  const showTopMatches = currentPage === 1 && sortBy === "relevance";
  const topMatches = useMemo(
    () => (showTopMatches ? sortedPrimary.slice(0, TOP_MATCHES_COUNT) : []),
    [showTopMatches, sortedPrimary]
  );
  const topMatchIds = useMemo(
    () => new Set(topMatches.map((lawyer) => lawyer.id)),
    [topMatches]
  );
  const primaryBase = sortBy === "relevance" ? sortedPrimary : primaryLawyers;
  const secondaryBase = sortBy === "relevance" ? sortedSecondary : secondaryLawyers;
  const primaryIds = useMemo(
    () => new Set(primaryBase.map((lawyer) => lawyer.id)),
    [primaryBase]
  );
  const primaryRemainder = useMemo(
    () => primaryBase.filter((lawyer) => !topMatchIds.has(lawyer.id)),
    [primaryBase, topMatchIds]
  );
  const secondaryFiltered = useMemo(
    () => secondaryBase.filter((lawyer) => !primaryIds.has(lawyer.id)),
    [secondaryBase, primaryIds]
  );
  const shouldBlendSecondary = primaryBase.length < LAWYERS_PER_PAGE;
  const combinedBase = showTopMatches
    ? [...primaryRemainder, ...(shouldBlendSecondary ? secondaryFiltered : [])]
    : [...primaryBase, ...(shouldBlendSecondary ? secondaryFiltered : [])];
  const combinedLawyers = sortBy === "relevance" ? combinedBase : sortLawyers(combinedBase, sortBy);
  const totalResults = topMatches.length + combinedLawyers.length;
  const totalPages = Math.max(1, Math.ceil(combinedLawyers.length / LAWYERS_PER_PAGE));
  const paginatedLawyers = combinedLawyers.slice(
    (currentPage - 1) * LAWYERS_PER_PAGE,
    currentPage * LAWYERS_PER_PAGE
  );

  const applyFilters = useCallback(() => {
    setCurrentPage(1);
    fetchMatchingLawyers(filters);
  }, [fetchMatchingLawyers, filters]);

  const setLocationFilter = useCallback(
    (nextLocations: string[]) => {
      const params = new URLSearchParams(searchParams);
      if (nextLocations.length === 0) {
        params.delete("location");
        params.delete("locations");
      } else {
        params.set("locations", nextLocations.join(","));
        params.set("location", nextLocations[0]);
      }
      params.delete("search_id");
      params.delete("ai");
      setCurrentPage(1);
      navigate(`/search-results?${params.toString()}`);
    },
    [navigate, searchParams]
  );

  const clearPracticeArea = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("practice_area");
    navigate(`/search-results?${params.toString()}`);
  }, [navigate, searchParams]);

  const browseAllLawyers = useCallback(() => {
    navigate("/lawyers");
  }, [navigate]);

  const notifyOnMatches = useCallback(() => {
    toast({
      title: "Search alert saved",
      description: "We'll notify you when matching lawyers join.",
    });
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    const searchId = searchParams.get("search_id") || "";
    if (!searchId || primaryLawyers.length === 0 || sortBy !== "relevance") return undefined;

    if (matchedSaveRef.current.id !== searchId) {
      matchedSaveRef.current = { id: searchId, saved: false };
    }

    if (matchedSaveRef.current.saved) return undefined;

    const topMatchesToSave = sortedPrimary.slice(0, 10).map((lawyer) => lawyer.id);
    if (topMatchesToSave.length === 0) return undefined;

    supabase
      .from("client_search")
      .update({ matched_lawyers: topMatchesToSave })
      .eq("id", searchId)
      .then(() => {
        if (!cancelled) {
          matchedSaveRef.current.saved = true;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [primaryLawyers, searchParams, sortBy, sortedPrimary]);

  return {
    practiceArea,
    location,
    selectedLocations: locationTokens,
    budget,
    specificIssue,
    languages,
    keywords,
    urgency,
    aiMatch,
    lawyers: sortedPrimary,
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
    setSortBy,
    setShowFilters,
    setShowScoreInfo,
    setFilters,
    setCurrentPage,
    setLocationFilter,
    applyFilters,
    clearPracticeArea,
    browseAllLawyers,
    notifyOnMatches,
  };
};
