// tCredex v1.6 - Term Sheet Expiry Engine

export interface TermSheet {
  id: string;
  deal_id: string;
  expires_at: string;
  status: "active" | "expired" | "executed";
}

export interface ExpiryAlert {
  deal_id: string;
  term_sheet_id: string;
  expires_at: string;
  days_remaining: number;
  urgency: "critical" | "warning" | "notice";
}

/**
 * Check for term sheets expiring within threshold
 */
export function checkExpiringTermSheets(
  termSheets: TermSheet[],
  thresholdDays: number = 5,
): ExpiryAlert[] {
  const now = new Date();
  const threshold = new Date(
    now.getTime() + thresholdDays * 24 * 60 * 60 * 1000,
  );

  const alerts: ExpiryAlert[] = [];

  for (const ts of termSheets) {
    if (ts.status !== "active") continue;

    const expiryDate = new Date(ts.expires_at);
    if (expiryDate <= threshold) {
      const daysRemaining = Math.floor(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      let urgency: "critical" | "warning" | "notice";
      if (daysRemaining <= 1) urgency = "critical";
      else if (daysRemaining <= 3) urgency = "warning";
      else urgency = "notice";

      alerts.push({
        deal_id: ts.deal_id,
        term_sheet_id: ts.id,
        expires_at: ts.expires_at,
        days_remaining: Math.max(0, daysRemaining),
        urgency,
      });
    }
  }

  return alerts.sort((a, b) => a.days_remaining - b.days_remaining);
}

/**
 * Calculate default expiry date (30 days from now)
 */
export function getDefaultExpiryDate(daysFromNow: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}
