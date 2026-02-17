/**
 * tCredex Closing Fee Engine
 * 1.8% on first $10M, 1.5% on amounts over $10M
 */

export function calculateClosingFee(grossBasis: number): number {
  if (grossBasis <= 10_000_000) return grossBasis * 0.018;
  return (10_000_000 * 0.018) + ((grossBasis - 10_000_000) * 0.015);
}

export function formatFee(fee: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(fee);
}

export function getEffectiveRate(grossBasis: number): number {
  const fee = calculateClosingFee(grossBasis);
  return (fee / grossBasis) * 100;
}
