import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { SearchFilters } from "@/hooks/useSearchResults";
import { BASE_LANGUAGE_OPTIONS } from "@/components/lawyer/dashboard/constants";

interface SearchFiltersPanelProps {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  onApply: () => void;
}

export function SearchFiltersPanel({ filters, onChange, onApply }: SearchFiltersPanelProps) {
  const updateFilters = (patch: Partial<SearchFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const selectedLanguages = filters.languages
    ? filters.languages.split(",").map((value) => value.trim()).filter(Boolean)
    : [];

  return (
    <div className="mb-8 p-6 border rounded-lg bg-muted/30 space-y-4">
      <h3 className="font-semibold mb-4">Refine Your Search</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="minExperience" className="text-sm font-medium mb-2 block">
            Min. Experience
          </Label>
          <Select
            value={filters.minExperience}
            onValueChange={(value) => updateFilters({ minExperience: value })}
          >
            <SelectTrigger id="minExperience">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="5">5+ years</SelectItem>
              <SelectItem value="10">10+ years</SelectItem>
              <SelectItem value="15">15+ years</SelectItem>
              <SelectItem value="20">20+ years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="minRating" className="text-sm font-medium mb-2 block">
            Min. Rating
          </Label>
          <Select
            value={filters.minRating}
            onValueChange={(value) => updateFilters({ minRating: value })}
          >
            <SelectTrigger id="minRating">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="3.5">3.5+ stars</SelectItem>
              <SelectItem value="4.0">4.0+ stars</SelectItem>
              <SelectItem value="4.5">4.5+ stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="languages" className="text-sm font-medium mb-2 block">
            Languages
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedLanguages.length > 0
                  ? `${selectedLanguages.length} selected`
                  : "Select languages"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0 w-[260px]">
              <Command>
                <CommandInput placeholder="Search languages..." />
                <CommandList>
                  <CommandEmpty>No language found.</CommandEmpty>
                  <CommandGroup>
                    {BASE_LANGUAGE_OPTIONS.map((lang) => {
                      const selected = selectedLanguages.some(
                        (item) => item.toLowerCase() === lang.toLowerCase()
                      );
                      return (
                        <CommandItem
                          key={lang}
                          onSelect={() => {
                            const next = selected
                              ? selectedLanguages.filter(
                                  (value) => value.toLowerCase() !== lang.toLowerCase()
                                )
                              : [...selectedLanguages, lang];
                            updateFilters({ languages: next.join(",") });
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                          {lang}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedLanguages.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedLanguages.map((lang) => (
                <Badge key={lang} variant="secondary" className="flex items-center gap-2">
                  {lang}
                  <button
                    type="button"
                    className="text-xs"
                    onClick={() => {
                      const next = selectedLanguages.filter(
                        (value) => value.toLowerCase() !== lang.toLowerCase()
                      );
                      updateFilters({ languages: next.join(",") });
                    }}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button onClick={onApply} className="w-full md:w-auto">
        Apply Filters
      </Button>
    </div>
  );
}
