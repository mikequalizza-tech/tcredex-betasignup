// tCredex v1.6 - QEI Timeline Estimator

export interface QEIDates {
  qei_date: string;
  qlici_due: string;    // 12 months from QEI
  year_5_date: string;  // Refinancing assessment
  unwind_date: string;  // 7 years from QEI
}

/**
 * Calculate key NMTC compliance dates from QEI date
 */
export function getQEIDates(qeiDate: string): QEIDates {
  const qei = new Date(qeiDate);
  
  // QLICI due 12 months after QEI (substantially all test)
  const qliciDue = new Date(qei);
  qliciDue.setMonth(qliciDue.getMonth() + 12);

  // Year 5 - typical refinancing assessment window
  const year5 = new Date(qei);
  year5.setFullYear(year5.getFullYear() + 5);

  // Unwind date - 7 years from QEI
  const unwind = new Date(qei);
  unwind.setFullYear(unwind.getFullYear() + 7);

  return {
    qei_date: qei.toISOString().split('T')[0],
    qlici_due: qliciDue.toISOString().split('T')[0],
    year_5_date: year5.toISOString().split('T')[0],
    unwind_date: unwind.toISOString().split('T')[0],
  };
}

/**
 * Check if approaching a critical compliance date
 */
export function getUpcomingMilestones(qeiDate: string, warningDays: number = 90): {
  milestone: string;
  date: string;
  daysRemaining: number;
  urgent: boolean;
}[] {
  const dates = getQEIDates(qeiDate);
  const today = new Date();
  const milestones: { milestone: string; date: string; daysRemaining: number; urgent: boolean }[] = [];

  const checkDate = (milestone: string, dateStr: string) => {
    const date = new Date(dateStr);
    const daysRemaining = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 0 && daysRemaining <= warningDays * 2) {
      milestones.push({
        milestone,
        date: dateStr,
        daysRemaining,
        urgent: daysRemaining <= warningDays
      });
    }
  };

  checkDate('QLICI Substantially All Due', dates.qlici_due);
  checkDate('Year 5 Refinancing Window', dates.year_5_date);
  checkDate('7-Year Unwind', dates.unwind_date);

  return milestones.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
