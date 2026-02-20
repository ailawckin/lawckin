import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getServiceAreas } from "@/config/country";
import { countryConfig } from "@/config/country";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

const LANGUAGE_OPTIONS = ["English", "Spanish", "Chinese", "Russian", "French"];

interface ServiceLocationStepProps {
  serviceLocation: string;
  streetAddress: string;
  languages: string[];
  onServiceLocationChange: (value: string) => void;
  onStreetAddressChange: (value: string) => void;
  onToggleLanguage: (language: string) => void;
}

export function ServiceLocationStep({
  serviceLocation,
  streetAddress,
  languages,
  onServiceLocationChange,
  onStreetAddressChange,
  onToggleLanguage,
}: ServiceLocationStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Service Location</h2>
      <p className="text-muted-foreground">{countryConfig.copy.onboardingLocationDescription}</p>
      <div className="space-y-2">
        <Label htmlFor="serviceLocation">{countryConfig.copy.onboardingLocationLabel} *</Label>
        <Select value={serviceLocation} onValueChange={onServiceLocationChange} required>
          <SelectTrigger id="serviceLocation">
            <SelectValue placeholder="Select your service area" />
          </SelectTrigger>
          <SelectContent>
            {getServiceAreas().map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This is the location clients will see when searching for lawyers
        </p>
      </div>

      <AddressAutocomplete
        value={streetAddress}
        onChange={onStreetAddressChange}
        placeholder="Start typing your business address..."
        id="streetAddress"
        label="Business Address (Optional)"
      />
      <p className="text-xs text-muted-foreground">
        Your full business address. This is for internal use only and will not be shown to clients.
      </p>

      <div className="space-y-2">
        <Label>Languages</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <Button
              key={lang}
              type="button"
              variant={languages.includes(lang) ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleLanguage(lang)}
            >
              {lang}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
