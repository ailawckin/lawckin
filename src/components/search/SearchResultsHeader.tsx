import { ArrowUpDown, Check, Filter, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import type { SearchSortOption } from "@/hooks/useSearchResults";
import { getServiceAreas } from "@/config/country";

interface SearchResultsHeaderProps {
  practiceArea: string;
  location: string;
  selectedLocations: string[];
  onLocationChange: (next: string[]) => void;
  sortBy: SearchSortOption;
  onSortChange: (value: SearchSortOption) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function SearchResultsHeader({
  practiceArea,
  location,
  selectedLocations,
  onLocationChange,
  sortBy,
  onSortChange,
  showFilters,
  onToggleFilters,
}: SearchResultsHeaderProps) {
  const locationOptions = Array.from(
    new Set([...getServiceAreas(), ...selectedLocations])
  );

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Search Results</h1>
        <p className="text-lg text-muted-foreground">
          {practiceArea && `${practiceArea} specialists`}
          {location && ` in ${location}`}
          {!practiceArea && !location && "All lawyers"}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              {selectedLocations.length > 0
                ? `${selectedLocations.length} location${selectedLocations.length > 1 ? "s" : ""}`
                : "All locations"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0 w-[280px]">
            <Command>
              <CommandInput placeholder="Search locations..." />
              <CommandList>
                <CommandEmpty>No location found.</CommandEmpty>
                <CommandGroup>
                  {locationOptions.map((option) => {
                    const selected = selectedLocations.some(
                      (value) => value.toLowerCase() === option.toLowerCase()
                    );
                    return (
                      <CommandItem
                        key={option}
                        onSelect={() => {
                          const next = selected
                            ? selectedLocations.filter(
                                (value) => value.toLowerCase() !== option.toLowerCase()
                              )
                            : [...selectedLocations, option];
                          onLocationChange(next);
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                        {option}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
            {selectedLocations.length > 0 && (
              <div className="border-t p-3 flex flex-wrap gap-2">
                {selectedLocations.map((value) => (
                  <Badge key={value} variant="secondary" className="flex items-center gap-2">
                    {value}
                    <button
                      type="button"
                      className="text-xs"
                      onClick={() =>
                        onLocationChange(
                          selectedLocations.filter(
                            (item) => item.toLowerCase() !== value.toLowerCase()
                          )
                        )
                      }
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-xs"
                  onClick={() => onLocationChange([])}
                >
                  Clear
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SearchSortOption)}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Best Match</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="price">Lowest Price</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onToggleFilters} aria-pressed={showFilters}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
    </div>
  );
}
