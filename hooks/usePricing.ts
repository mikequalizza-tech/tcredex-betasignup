import { useEffect, useState } from "react";

interface PricingData {
  notes?: string;
  plans?: Array<{
    name: string;
    price: number;
    features: string[];
  }>;
}

export function usePricing() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchPricing() {
      try {
        const res = await fetch("/api/pricing");
        if (!res.ok) throw new Error("Failed to fetch pricing");
        const data = await res.json();
        if (!ignore) {
          setPricing(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchPricing();
    return () => {
      ignore = true;
    };
  }, []);

  return { pricing, loading, error };
}
