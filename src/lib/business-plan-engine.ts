export type QuarterFlags = { q1: boolean; q2: boolean; q3: boolean; q4: boolean };

export type ActivityLike = QuarterFlags & {
  estimatedCost: number | string;
  recurrentBudget?: number | string | null;
};

export const MONTHS = [
  'January', 'February', 'March',
  'April', 'May', 'June',
  'July', 'August', 'September',
  'October', 'November', 'December'
] as const;

export type MonthName = typeof MONTHS[number];

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function selectedQuarterCount(activity: QuarterFlags): number {
  return [activity.q1, activity.q2, activity.q3, activity.q4].filter(Boolean).length;
}

export function selectedMonthCount(activity: QuarterFlags): number {
  return selectedQuarterCount(activity) * 3;
}

export function allocateMonthly(activity: ActivityLike): Record<MonthName, number> {
  const cost = toNumber(activity.recurrentBudget ?? activity.estimatedCost);
  const monthCount = selectedMonthCount(activity);
  const monthly = monthCount > 0 ? cost / monthCount : 0;

  const result = Object.fromEntries(MONTHS.map((m) => [m, 0])) as Record<MonthName, number>;
  const setQuarter = (months: MonthName[], enabled: boolean) => {
    if (!enabled) return;
    months.forEach((m) => { result[m] = monthly; });
  };

  setQuarter(['January', 'February', 'March'], activity.q1);
  setQuarter(['April', 'May', 'June'], activity.q2);
  setQuarter(['July', 'August', 'September'], activity.q3);
  setQuarter(['October', 'November', 'December'], activity.q4);
  return result;
}

export function summarizePlan(activities: ActivityLike[]) {
  const totalEstimatedCost = activities.reduce((sum, a) => sum + toNumber(a.estimatedCost), 0);
  const totalRecurrentBudget = activities.reduce((sum, a) => sum + toNumber(a.recurrentBudget ?? a.estimatedCost), 0);
  const monthlyTotals = Object.fromEntries(MONTHS.map((m) => [m, 0])) as Record<MonthName, number>;

  for (const activity of activities) {
    const allocation = allocateMonthly(activity);
    for (const month of MONTHS) monthlyTotals[month] += allocation[month];
  }

  const cashflowTotal = MONTHS.reduce((sum, month) => sum + monthlyTotals[month], 0);
  return {
    totalEstimatedCost,
    totalRecurrentBudget,
    unfundedCost: totalEstimatedCost - totalRecurrentBudget,
    monthlyTotals,
    cashflowTotal,
    isBalanced: Math.abs(cashflowTotal - totalRecurrentBudget) < 0.01
  };
}

export function formatVatu(amount: number) {
  return new Intl.NumberFormat('en-VU', {
    maximumFractionDigits: 0
  }).format(amount);
}
