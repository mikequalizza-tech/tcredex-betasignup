/**
 * Term Sheet Expiry Engine
 * Monitors expiring term sheets and triggers alerts
 */

export interface TermSheet {
  dealId: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'executed';
}

export interface ExpiringTermSheet {
  dealId: string;
  expiresAt: string;
  daysRemaining: number;
}

export function getExpiringTermSheets(
  termSheets: TermSheet[],
  thresholdDays: number = 5
): ExpiringTermSheet[] {
  const now = new Date();
  const threshold = new Date(now.getTime() + thresholdDays * 86400_000);
  
  return termSheets
    .filter(ts => ts.status === 'active')
    .filter(ts => new Date(ts.expiresAt) <= threshold)
    .map(ts => ({
      dealId: ts.dealId,
      expiresAt: ts.expiresAt,
      daysRemaining: Math.ceil(
        (new Date(ts.expiresAt).getTime() - now.getTime()) / 86400_000
      ),
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function getExpiryStatus(expiresAt: string): 'expired' | 'critical' | 'warning' | 'ok' {
  const days = Math.ceil(
    (new Date(expiresAt).getTime() - new Date().getTime()) / 86400_000
  );
  
  if (days < 0) return 'expired';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'warning';
  return 'ok';
}
