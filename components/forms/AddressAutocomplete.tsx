'use client';

import { useState, useEffect, useRef } from 'react';

interface AddressSuggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{
    id: string;
    text: string;
  }>;
  properties?: {
    address?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  onCensusTractFound?: (tract: string | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  label?: string;
  id?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onCensusTractFound,
  placeholder = "Start typing an address...",
  className = "",
  required = false,
  label,
  id = "address-autocomplete",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Flag to prevent re-search after selection
  const justSelectedRef = useRef(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    // Skip search if we just selected an address
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    if (!value || value.length < 3 || !mapboxToken) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?` +
          `access_token=${mapboxToken}&country=us&types=address&limit=5`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Geocoding error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, mapboxToken]);

  // Lookup census tract from coordinates via our API (avoids CORS issues)
  const lookupCensusTract = async (lng: number, lat: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `/api/geo/tract-lookup?lat=${lat}&lng=${lng}`
      );
      const data = await response.json();
      
      if (data.tract_id) {
        return data.tract_id;
      }
      return null;
    } catch (error) {
      console.error('Census tract lookup error:', error);
      return null;
    }
  };

  const handleSelect = async (suggestion: AddressSuggestion) => {
    // Set flag BEFORE changing value to prevent re-search
    justSelectedRef.current = true;
    
    onChange(suggestion.place_name);
    setIsOpen(false);
    setSuggestions([]);
    
    if (onSelect) {
      onSelect(suggestion);
    }

    // Lookup census tract
    if (onCensusTractFound && suggestion.center) {
      const [lng, lat] = suggestion.center;
      const tract = await lookupCensusTract(lng, lat);
      onCensusTractFound(tract);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        } else if (suggestions.length > 0) {
          // If no item highlighted, select first suggestion
          handleSelect(suggestions[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start gap-2">
                <svg 
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    index === highlightedIndex ? 'text-white' : 'text-gray-500'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{suggestion.place_name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!mapboxToken && (
        <p className="mt-1 text-xs text-amber-400">
          Address autocomplete requires NEXT_PUBLIC_MAPBOX_TOKEN
        </p>
      )}
    </div>
  );
}
