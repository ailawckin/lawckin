import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  id?: string;
  label?: string;
  required?: boolean;
  onPlaceSelect?: (place: { formatted_address?: string; address_components?: any[]; geometry?: any }) => void;
}

// Google Maps types - will be available when the API loads
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            inputField: HTMLInputElement,
            options?: {
              types?: string[];
              componentRestrictions?: { country?: string };
              fields?: string[];
            }
          ) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => {
              formatted_address?: string;
              address_components?: any[];
              geometry?: any;
            };
            setBounds: (bounds: any) => void;
          };
          PlaceResult: any;
        };
        LatLngBounds: new (sw?: any, ne?: any) => any;
        LatLng: new (lat: number, lng: number) => any;
      };
    };
  }
}

export const AddressAutocomplete = ({
  value,
  onChange,
  placeholder = "Start typing your address...",
  id = "address-autocomplete",
  label,
  required = false,
  onPlaceSelect,
}: AddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete();
      return;
    }

    // Load Google Maps Places API script
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn("VITE_GOOGLE_MAPS_API_KEY not set. Address autocomplete will not work.");
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );

    if (existingScript) {
      // Script already loading/loaded, wait for it
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogle);
          initializeAutocomplete();
        }
      }, 100);
      
      return () => clearInterval(checkGoogle);
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
      }
    };

    script.onerror = () => {
      console.error("Failed to load Google Maps API. Please check your API key.");
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com/maps/api/js"]`
      );
      if (existingScript) {
        // Don't remove if other components might need it
      }
    };
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    // Create autocomplete instance
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["address"], // Restrict to addresses
        componentRestrictions: { country: countryConfig.code === 'ch' ? 'ch' : 'us' }, // Limit to country addresses
        fields: ["formatted_address", "address_components", "geometry"],
      }
    );

    // Bias results towards country bounds
    if (countryConfig.mapBounds) {
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(
          countryConfig.mapBounds.southwest.lat,
          countryConfig.mapBounds.southwest.lng
        ),
        new window.google.maps.LatLng(
          countryConfig.mapBounds.northeast.lat,
          countryConfig.mapBounds.northeast.lng
        )
      );
      autocomplete.setBounds(bounds);
    }

    // Listen for place selection
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      
      if (place.formatted_address) {
        onChange(place.formatted_address);
        
        if (onPlaceSelect) {
          onPlaceSelect(place);
        }
      }
    });

    autocompleteRef.current = autocomplete;
    setIsLoaded(true);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={required ? "required" : ""}>
          {label}
        </Label>
      )}
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="text"
        autoComplete="street-address"
      />
      {!isLoaded && !window.google?.maps?.places && (
        <p className="text-xs text-muted-foreground">
          Loading address suggestions...
        </p>
      )}
    </div>
  );
};

