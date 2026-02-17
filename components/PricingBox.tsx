"use client";

import { usePricing } from "@/hooks/usePricing";

export default function PricingBox() {
  const { pricing, loading, error } = usePricing();
  
  if (loading) return <div>Loading pricing...</div>;
  if (error) return <div>Error loading pricing: {error}</div>;
  if (!pricing) return null;
  
  return (
    <section>
      <h2>Current Pricing</h2>
      <div>{pricing.notes}</div>
    </section>
  );
}
