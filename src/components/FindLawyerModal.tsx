import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import { classifyLegalIssue } from "@/lib/aiClassifier";
import { countryConfig, getServiceAreas } from "@/config/country";
import { SPECIFIC_ISSUES } from "@/lib/practiceAreaIssues";
import { getPracticeAreaSearchTerm } from "@/lib/practiceAreaMatch";
import { BASE_LANGUAGE_OPTIONS } from "@/components/lawyer/dashboard/constants";

interface FindLawyerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AiIntakeResult = {
  practice_area: string;
  specific_issue: string | null;
  keywords: string[];
  summary: string;
  confidence: number;
  urgency?: string | null;
  budget_band?: string | null;
  preferred_language?: string | null;
};

type AiIntakePayload = {
  output: AiIntakeResult;
  embedding: number[] | null;
  embedding_model: string | null;
};

const PRACTICE_AREA_OPTIONS = [...Object.keys(SPECIFIC_ISSUES), "General Legal Guidance"];

const BUDGET_BANDS = [
  "Under $150/hr",
  "$150–$250/hr",
  "$250–$400/hr",
  "$400–$600/hr",
  "$600+/hr",
  "No preference",
];

const MIN_DESCRIPTION_WORDS = 8;

const FindLawyerModal = ({ open, onOpenChange }: FindLawyerModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [needsHelp, setNeedsHelp] = useState(false);
  const [anyLocation, setAnyLocation] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [urgency, setUrgency] = useState("No rush / exploring");
  const [budgetBand, setBudgetBand] = useState("No preference");
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [aiResult, setAiResult] = useState<AiIntakeResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedPracticeArea, setSelectedPracticeArea] = useState("");
  const [selectedSpecificIssue, setSelectedSpecificIssue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const urgencies = [
    "Today (urgent)",
    "Next few days",
    "Next week",
    "No rush / exploring",
  ];

  const locationOptions = getServiceAreas();

  const isBusy = isSubmitting || aiLoading;

  const countWords = (value: string) =>
    value.trim().split(/\s+/).filter(Boolean).length;

  const canSubmit = () => {
    if (!anyLocation && selectedLocations.length === 0) return false;
    if (!selectedPracticeArea && countWords(description) < MIN_DESCRIPTION_WORDS) return false;
    return true;
  };

  const normalizePracticeArea = (value: string) => {
    if (!value) return "";
    const match = PRACTICE_AREA_OPTIONS.find(
      (area) => area.toLowerCase() === value.toLowerCase()
    );
    return match || "General Legal Guidance";
  };

  const fallbackClassification = () => {
    const result = classifyLegalIssue(description.trim());
    return {
      practice_area: normalizePracticeArea(result.practiceArea || "General Legal Guidance"),
      specific_issue: result.specificIssue || null,
      keywords: result.matchedKeywords || [],
      summary: description.trim().slice(0, 220),
      confidence: Math.max(0, Math.min(1, (result.confidence || 0) / 100)),
      urgency: urgency || null,
      budget_band: budgetBand || null,
      preferred_language:
        preferredLanguages.length > 0 ? preferredLanguages.join(", ") : null,
    };
  };

  const runAiIntake = async (): Promise<AiIntakePayload | null> => {
    setAiLoading(true);
    setAiError("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-lawyer-intake", {
        body: {
          description: description.trim(),
          location: anyLocation ? null : selectedLocations.join(", "),
          urgency,
          budget_band: budgetBand,
          preferred_language: preferredLanguages.length > 0 ? preferredLanguages.join(", ") : null,
        },
      });

      if (error) {
        throw error;
      }

      const output = data?.output as AiIntakeResult | undefined;
      if (!output) {
        throw new Error("No AI response returned.");
      }

      const normalized: AiIntakeResult = {
        ...output,
        practice_area: normalizePracticeArea(output.practice_area),
        confidence: Math.max(0, Math.min(1, output.confidence ?? 0)),
        keywords: Array.isArray(output.keywords) ? output.keywords : [],
      };

      setAiResult(normalized);
      setSelectedPracticeArea(normalized.practice_area);
      setSelectedSpecificIssue(normalized.specific_issue || "");
      return {
        output: normalized,
        embedding: Array.isArray(data?.embedding) ? (data.embedding as number[]) : null,
        embedding_model: typeof data?.embedding_model === "string" ? data.embedding_model : null,
      };
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : "AI matching failed.";
      const friendlyMessage = rawMessage.includes("Failed to send a request to the Edge Function")
        ? "AI matching is temporarily unavailable. Using our best-match fallback."
        : rawMessage;
      setAiError(friendlyMessage);
      const fallback = fallbackClassification();
      setAiResult(fallback);
      setSelectedPracticeArea(fallback.practice_area);
      setSelectedSpecificIssue(fallback.specific_issue || "");
      if (preferredLanguages.length === 0 && fallback.preferred_language) {
        setPreferredLanguages(
          fallback.preferred_language
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        );
      }
      return {
        output: fallback,
        embedding: null,
        embedding_model: null,
      };
    } finally {
      setAiLoading(false);
    }
  };

  const buildManualEmbeddingInput = () => {
    const parts = [
      selectedPracticeArea ? `Practice area: ${selectedPracticeArea}` : null,
      selectedSpecificIssue ? `Specific issue: ${selectedSpecificIssue}` : null,
      selectedLocations.length > 0 ? `Locations: ${selectedLocations.join(", ")}` : null,
      preferredLanguages.length > 0 ? `Languages: ${preferredLanguages.join(", ")}` : null,
      budgetBand ? `Budget: ${budgetBand}` : null,
      urgency ? `Urgency: ${urgency}` : null,
    ];

    return parts.filter(Boolean).join("\n");
  };

  const fetchSearchEmbedding = async (input: string) => {
    if (!input || input.trim().length < 10) return null;
    try {
      const { data, error } = await supabase.functions.invoke("ai-lawyer-profile-embedding", {
        body: { input },
      });

      if (error) {
        return null;
      }

      return {
        embedding: Array.isArray(data?.embedding) ? (data.embedding as number[]) : null,
        embedding_model: typeof data?.embedding_model === "string" ? data.embedding_model : null,
      };
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (needsHelp && countWords(description) < MIN_DESCRIPTION_WORDS) {
        toast({
          title: "Add a short description",
          description: `Please share at least ${MIN_DESCRIPTION_WORDS} words so we can categorize your case.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const shouldRunAi = needsHelp && countWords(description) >= MIN_DESCRIPTION_WORDS;
      const aiPayload = shouldRunAi ? await runAiIntake() : null;
      const manualEmbeddingInput = !shouldRunAi ? buildManualEmbeddingInput() : "";
      const manualEmbedding = !shouldRunAi ? await fetchSearchEmbedding(manualEmbeddingInput) : null;
      const aiOutput = aiPayload?.output ?? null;
      const resolvedPracticeAreaInput =
        selectedPracticeArea || aiOutput?.practice_area || aiResult?.practice_area || "";
      const resolvedPracticeArea = normalizePracticeArea(resolvedPracticeAreaInput);
      const searchPracticeArea = getPracticeAreaSearchTerm(resolvedPracticeArea);
      if (!resolvedPracticeArea) {
        toast({
          title: "Select a practice area",
          description: "Choose a practice area or use the optional description to help us categorize.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      const resolvedSpecificIssue =
        selectedSpecificIssue || aiOutput?.specific_issue || aiResult?.specific_issue || null;
      const resolvedKeywords =
        aiOutput?.keywords?.length
          ? aiOutput.keywords
          : aiResult?.keywords?.length
            ? aiResult.keywords
          : resolvedSpecificIssue
            ? [resolvedSpecificIssue]
            : [];
      const primaryLocation = anyLocation ? "Any" : selectedLocations[0] || "";
      const searchData = {
        user_id: user?.id || null,
        practice_area: searchPracticeArea,
        specific_issue: resolvedSpecificIssue,
        ny_location: primaryLocation,
        ny_locations: anyLocation ? null : selectedLocations,
        budget_band: budgetBand,
        situation: shouldRunAi ? description.trim() : null,
        urgency: urgency,
        meeting_preference: null,
        preferred_language: preferredLanguages.length > 0 ? preferredLanguages.join(", ") : null,
        fee_model: null,
        intake_mode: shouldRunAi ? "ai" : "manual",
        ai_output: aiOutput || aiResult || null,
        ai_summary: aiOutput?.summary || aiResult?.summary || null,
        ai_confidence: aiOutput?.confidence ?? aiResult?.confidence ?? null,
        ai_keywords: aiOutput?.keywords || aiResult?.keywords || null,
        ai_practice_area: aiOutput?.practice_area || aiResult?.practice_area || null,
        ai_specific_issue: aiOutput?.specific_issue || aiResult?.specific_issue || null,
        ai_embedding: aiPayload?.embedding || manualEmbedding?.embedding || null,
        ai_embedding_model: aiPayload?.embedding_model || manualEmbedding?.embedding_model || null,
      };

      const { data: searchRow, error } = await supabase
        .from("client_search")
        .insert(searchData)
        .select("id")
        .single();

      if (error) throw error;

      const searchParams = new URLSearchParams();
      if (searchPracticeArea) {
        searchParams.set("practice_area", searchPracticeArea);
      }
      if (resolvedSpecificIssue) {
        searchParams.set("specific_issue", resolvedSpecificIssue);
      }
      if (!anyLocation && primaryLocation) {
        searchParams.set("location", primaryLocation);
      }
      if (!anyLocation && selectedLocations.length > 0) {
        searchParams.set("locations", selectedLocations.join(","));
      }
      if (budgetBand) {
        searchParams.set("budget", budgetBand);
      }
      if (preferredLanguages.length > 0) {
        searchParams.set("languages", preferredLanguages.join(","));
      }
      if (urgency) {
        searchParams.set("urgency", urgency);
      }
      if (resolvedKeywords.length > 0) {
        searchParams.set("keywords", resolvedKeywords.join(","));
      }
      if (shouldRunAi) {
        searchParams.set("ai", "true");
      }

      if (searchRow?.id) {
        searchParams.set("search_id", searchRow.id);
      }

      navigate(`/search-results?${searchParams.toString()}`);
      onOpenChange(false);

      toast({
        title: "Searching for lawyers",
        description: "Finding the best matches for you...",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      const isNetworkError =
        isOffline ||
        /Failed to fetch|NetworkError|ERR_NAME_NOT_RESOLVED|CORS|fetch/i.test(
          errorMessage
        );

      toast({
        title: "Error saving search",
        description: isNetworkError
          ? "We couldn't reach the server. Check your internet connection and Supabase CORS settings, then try again."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setNeedsHelp(false);
      setAnyLocation(false);
      setSelectedLocations([]);
      setUrgency("No rush / exploring");
      setBudgetBand("No preference");
      setPreferredLanguages([]);
      setDescription("");
      setAiResult(null);
      setAiError("");
      setAiLoading(false);
      setSelectedPracticeArea("");
      setSelectedSpecificIssue("");
      setIsSubmitting(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full max-h-[100vh] w-full h-[100vh] p-0 gap-0 border-0 rounded-none overflow-hidden [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Find Your Lawyer</DialogTitle>
          <DialogDescription>
            Provide your preferences and let us match you with the right lawyer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-full bg-background overflow-hidden">
          <div className="px-6 py-4 border-b flex-shrink-0">
            <div className="max-w-4xl mx-auto relative">
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="space-y-1 pr-10">
                <h2 className="text-2xl md:text-3xl font-bold">Find a lawyer</h2>
                <p className="text-sm text-muted-foreground">
                  Tell us the basics. Optional details help us categorize your case.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
              <section className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{countryConfig.copy.locationQuestion}</h3>
                  <p className="text-sm text-muted-foreground">{countryConfig.copy.locationDescription}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="any-location"
                      checked={anyLocation}
                      onCheckedChange={(value) => {
                        const nextValue = Boolean(value);
                        setAnyLocation(nextValue);
                        if (nextValue) {
                          setSelectedLocations([]);
                        }
                      }}
                    />
                    <Label htmlFor="any-location">Any location</Label>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-between">
                        {selectedLocations.length > 0
                          ? `${selectedLocations.length} selected`
                          : "Select locations"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0 w-[360px]">
                      <Command>
                        <CommandInput placeholder="Search locations..." />
                        <CommandList>
                          <CommandEmpty>No location found.</CommandEmpty>
                          <CommandGroup>
                            {locationOptions.map((location) => {
                              const selected = selectedLocations.some(
                                (item) => item.toLowerCase() === location.toLowerCase()
                              );
                              return (
                                <CommandItem
                                  key={location}
                                  onSelect={() => {
                                    if (anyLocation) {
                                      setAnyLocation(false);
                                    }
                                    if (selected) {
                                      setSelectedLocations((prev) =>
                                        prev.filter(
                                          (value) => value.toLowerCase() !== location.toLowerCase()
                                        )
                                      );
                                    } else {
                                      setSelectedLocations((prev) => [...prev, location]);
                                    }
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`}
                                  />
                                  {location}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedLocations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedLocations.map((location) => (
                        <Badge key={location} variant="secondary" className="flex items-center gap-2">
                          {location}
                          <button
                            type="button"
                            className="text-xs"
                            onClick={() =>
                              setSelectedLocations((prev) =>
                                prev.filter(
                                  (value) => value.toLowerCase() !== location.toLowerCase()
                                )
                              )
                            }
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-semibold">How soon do you need help?</h3>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencies.map((urgencyOption) => (
                      <SelectItem key={urgencyOption} value={urgencyOption}>
                        {urgencyOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-semibold">Preferences</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Budget range</Label>
                    <Select value={budgetBand} onValueChange={setBudgetBand}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_BANDS.map((band) => (
                          <SelectItem key={band} value={band}>
                            {band}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred languages (optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-between">
                          {preferredLanguages.length > 0
                            ? `${preferredLanguages.length} selected`
                            : "Select languages"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="p-0 w-[320px]">
                        <Command>
                          <CommandInput placeholder="Search languages..." />
                          <CommandList>
                            <CommandEmpty>No language found.</CommandEmpty>
                            <CommandGroup>
                              {BASE_LANGUAGE_OPTIONS.map((lang) => {
                                const selected = preferredLanguages.some(
                                  (item) => item.toLowerCase() === lang.toLowerCase()
                                );
                                return (
                                  <CommandItem
                                    key={lang}
                                    onSelect={() => {
                                      if (selected) {
                                        setPreferredLanguages((prev) =>
                                          prev.filter(
                                            (value) => value.toLowerCase() !== lang.toLowerCase()
                                          )
                                        );
                                      } else {
                                        setPreferredLanguages((prev) => [...prev, lang]);
                                      }
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        selected ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {lang}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {preferredLanguages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {preferredLanguages.map((lang) => (
                          <Badge key={lang} variant="secondary" className="flex items-center gap-2">
                            {lang}
                            <button
                              type="button"
                              className="text-xs"
                              onClick={() =>
                                setPreferredLanguages((prev) =>
                                  prev.filter((value) => value.toLowerCase() !== lang.toLowerCase())
                                )
                              }
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-semibold">Practice area</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{needsHelp ? "Practice area (optional)" : "Practice area"}</Label>
                    <Select
                      value={selectedPracticeArea}
                      onValueChange={(value) => {
                        setSelectedPracticeArea(value);
                        setSelectedSpecificIssue("");
                        if (needsHelp) {
                          setNeedsHelp(false);
                          setDescription("");
                          setAiResult(null);
                          setAiError("");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a practice area" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRACTICE_AREA_OPTIONS.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Specific issue (optional)</Label>
                    <Select value={selectedSpecificIssue} onValueChange={setSelectedSpecificIssue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an issue" />
                      </SelectTrigger>
                      <SelectContent>
                        {(SPECIFIC_ISSUES[selectedPracticeArea] || []).map((issue) => (
                          <SelectItem key={issue} value={issue}>
                            {issue}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-4 bg-muted/30">
                    <Checkbox
                      id="needs-help"
                      checked={needsHelp}
                      onCheckedChange={(value) => {
                        const nextValue = Boolean(value);
                        setNeedsHelp(nextValue);
                        if (nextValue) {
                          setSelectedPracticeArea("");
                          setSelectedSpecificIssue("");
                        }
                      }}
                    />
                  <div className="space-y-2">
                    <Label htmlFor="needs-help">Don’t know what type of law to look for?</Label>
                    <p className="text-sm text-muted-foreground">
                      Share a brief summary and we’ll categorize your request.
                    </p>
                  </div>
                </div>

                {needsHelp && (
                  <div className="space-y-3">
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder={`Briefly describe what happened (min ${MIN_DESCRIPTION_WORDS} words)...`}
                      rows={5}
                      className="text-base"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Minimum {MIN_DESCRIPTION_WORDS} words. Please avoid sensitive personal details.
                      </span>
                      <span>{countWords(description)} words</span>
                    </div>
                    {aiError ? (
                      <p className="text-xs text-muted-foreground">{aiError}</p>
                    ) : null}
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className="px-6 py-6 border-t bg-background/95 backdrop-blur-sm flex-shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit() || isBusy}
                className="min-w-[160px]"
              >
                {isBusy ? "Finding matches..." : "Show matches"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindLawyerModal;
