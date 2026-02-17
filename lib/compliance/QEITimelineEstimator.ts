/**
 * QEI Timeline Estimator
 * Calculates key compliance dates from QEI date
 */

export interface QEIDates {
  qei_date: string;
  qlici_due: string; // 12 months from QEI
  year_5_review: string; // 5 years from QEI
  unwind_date: string; // 7 years from QEI
}

export function getQEIDates(qeiDate: string): QEIDates {
  const qei = new Date(qeiDate);

  const qliciDue = new Date(qei);
  qliciDue.setMonth(qliciDue.getMonth() + 12);

  const year5Review = new Date(qei);
  year5Review.setFullYear(year5Review.getFullYear() + 5);

  const unwind = new Date(qei);
  unwind.setFullYear(unwind.getFullYear() + 7);

  return {
    qei_date: qei.toISOString().split("T")[0],
    qlici_due: qliciDue.toISOString().split("T")[0],
    year_5_review: year5Review.toISOString().split("T")[0],
    unwind_date: unwind.toISOString().split("T")[0],
  };
}

export function getDaysUntil(targetDate: string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isApproachingDeadline(
  targetDate: string,
  thresholdDays: number = 30,
): boolean {
  const days = getDaysUntil(targetDate);
  return days > 0 && days <= thresholdDays;
}
