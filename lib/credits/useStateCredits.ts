'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StateCreditMatch, CreditProgram } from './stateCreditMatcher';

interface UseStateCreditOptions {
  state?: string;
  programs?: CreditProgram[];
  enabled?: boolean;
}

interface UseStateCreditResult {
  credits: StateCreditMatch[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch state credits based on state and programs
 */
export function useStateCredits({
  state,
  programs,
  enabled = true,
}: UseStateCreditOptions): UseStateCreditResult {
  const [credits, setCredits] = useState<StateCreditMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize programs key to avoid complex expression in deps
  const programsKey = useMemo(() => programs?.join(','), [programs]);

  const fetchCredits = useCallback(async () => {
    if (!state || !enabled) {
      setCredits([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ state });
      if (programs && programs.length > 0) {
        params.set('programs', programs.join(','));
      }

      const response = await fetch(`/api/state-credits?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch state credits');
      }

      const data = await response.json();
      setCredits(data.credits || []);
    } catch (err) {
      console.error('[useStateCredits] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCredits([]);
    } finally {
      setIsLoading(false);
    }
  }, [state, programs, enabled]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits, programsKey]);

  return {
    credits,
    isLoading,
    error,
    refetch: fetchCredits,
  };
}

export default useStateCredits;
