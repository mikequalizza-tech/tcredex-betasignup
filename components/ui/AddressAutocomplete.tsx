"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Simple inline type definitions (no namespace needed)
interface PlaceResult {
  address_components?: AddressComponent[];
  formatted_address?: string;
  geometry?: {
    location?: {
      lat(): number;
      lng(): number;
    };
  };
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface AutocompleteInstance {
  addListener(event: string, handler: () => void): void;
  getPlace(): PlaceResult;
}

type AutocompleteCtor = new (
  input: HTMLInputElement,
  options?: Record<string, unknown>,
) => AutocompleteInstance;

export interface AddressData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface AddressAutocompleteProps {
  value?: string;
  onChange: (data: AddressData) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value = "",
  onChange,
  placeholder = "Start typing an address...",
  className = "",
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<AutocompleteInstance | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [isLoaded, setIsLoaded] = useState(false);

  // CRITICAL FIX: Only sync inputValue from prop when explicitly empty or on initial mount
  // Prevents race condition where parent re-render overwrites user selection
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (value) {
        setInputValue(value);
      }
      return;
    }
    // Only sync if parent explicitly clears the value (form reset)
    if (value === "" && inputValue !== "") {
      setInputValue("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omitting inputValue to avoid re-sync loops; only react to parent value changes
  }, [value]);

  // Load Google Places API
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already loaded
    const win = window as unknown as {
      google?: { maps?: { places?: unknown; event?: unknown } };
    };
    if (win.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true));
      return;
    }

    // Load the script
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn(
        "Google Places API key not found - address autocomplete disabled",
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error("Failed to load Google Places API");
    document.head.appendChild(script);
  }, []);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const win = window as unknown as {
      google?: {
        maps?: {
          places?: { Autocomplete: AutocompleteCtor };
          event?: { clearInstanceListeners: (instance: unknown) => void };
        };
      };
    };
    if (!win.google?.maps?.places) return;

    try {
      const AutocompleteClass = win.google.maps.places.Autocomplete;
      if (!AutocompleteClass) return;

      autocompleteRef.current = new AutocompleteClass(inputRef.current, {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "formatted_address", "geometry"],
        types: ["address"],
      }) as AutocompleteInstance;

      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete:", error);
    }

    return () => {
      if (autocompleteRef.current && win.google?.maps?.event) {
        win.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlePlaceSelect is a useCallback; autocomplete listener is set up once on load
  }, [isLoaded]);

  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (!place.address_components || !place.geometry) return;

    // Extract address components
    const addressData: AddressData = {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      county: "",
      lat: place.geometry.location?.lat() || 0,
      lng: place.geometry.location?.lng() || 0,
      formattedAddress: place.formatted_address || "",
    };

    let streetNumber = "";
    let streetName = "";

    for (const component of place.address_components) {
      const type = component.types[0];

      switch (type) {
        case "street_number":
          streetNumber = component.long_name;
          break;
        case "route":
          streetName = component.long_name;
          break;
        case "locality":
          addressData.city = component.long_name;
          break;
        case "administrative_area_level_1":
          addressData.state = component.long_name;
          break;
        case "administrative_area_level_2":
          addressData.county = component.long_name.replace(" County", "");
          break;
        case "postal_code":
          addressData.zipCode = component.long_name;
          break;
      }
    }

    addressData.address = `${streetNumber} ${streetName}`.trim();
    setInputValue(addressData.address);
    onChange(addressData);
  }, [onChange]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
        autoComplete="off"
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="w-4 h-4 animate-spin text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
