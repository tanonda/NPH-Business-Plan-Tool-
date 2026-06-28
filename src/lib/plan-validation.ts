import { toNumber } from '@/lib/business-plan-engine';

type PlanLike = {
  title?: unknown;
  facility?: unknown;
  costCenter?: unknown;
  costCenterName?: unknown;
  departmentId?: unknown;
  activities?: any[];
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

export type PlanValidationIssue = {
  path: string;
  message: string;
};

export function validatePlanForSubmission(plan: PlanLike): PlanValidationIssue[] {
  const issues: PlanValidationIssue[] = [];

  if (!clean(plan.title)) issues.push({ path: 'title', message: 'Plan title is required.' });
  if (!clean(plan.facility)) issues.push({ path: 'facility', message: 'Facility is required.' });
  if (!clean(plan.costCenter)) issues.push({ path: 'costCenter', message: 'Cost center is required.' });
  if (!clean(plan.costCenterName)) issues.push({ path: 'costCenterName', message: 'Cost center name is required.' });
  if (!clean(plan.departmentId)) issues.push({ path: 'departmentId', message: 'Plan must be linked to a department before review/submission.' });

  const activities = Array.isArray(plan.activities) ? plan.activities : [];
  if (activities.length === 0) issues.push({ path: 'activities', message: 'At least one activity is required.' });

  activities.forEach((activity, index) => {
    const label = `activities.${index + 1}`;
    if (!clean(activity.subProgram)) issues.push({ path: `${label}.subProgram`, message: `Activity ${index + 1}: sub-program is required.` });
    if (!clean(activity.activityNumber)) issues.push({ path: `${label}.activityNumber`, message: `Activity ${index + 1}: activity number is required.` });
    if (!clean(activity.activityDescription)) issues.push({ path: `${label}.activityDescription`, message: `Activity ${index + 1}: activity description is required.` });
    if (!clean(activity.expenditureDescription)) issues.push({ path: `${label}.expenditureDescription`, message: `Activity ${index + 1}: expenditure description is required.` });
    if (!clean(activity.responsibility)) issues.push({ path: `${label}.responsibility`, message: `Activity ${index + 1}: responsibility is required.` });

    const estimatedCost = toNumber(activity.estimatedCost);
    const recurrentBudget = toNumber(activity.recurrentBudget);
    const developmentPartners = toNumber(activity.developmentPartners);

    if (estimatedCost <= 0) issues.push({ path: `${label}.estimatedCost`, message: `Activity ${index + 1}: estimated cost must be greater than zero.` });
    if (recurrentBudget < 0) issues.push({ path: `${label}.recurrentBudget`, message: `Activity ${index + 1}: recurrent budget cannot be negative.` });
    if (developmentPartners < 0) issues.push({ path: `${label}.developmentPartners`, message: `Activity ${index + 1}: development partner funding cannot be negative.` });

    const hasQuarter = Boolean(activity.q1 || activity.q2 || activity.q3 || activity.q4);
    if (!hasQuarter) issues.push({ path: `${label}.quarters`, message: `Activity ${index + 1}: select at least one quarter.` });
  });

  const totalBudget = activities.reduce((sum, activity) => sum + toNumber(activity.estimatedCost), 0);
  if (activities.length > 0 && totalBudget <= 0) {
    issues.push({ path: 'activities.estimatedCost', message: 'Total estimated budget must be greater than zero.' });
  }

  return issues;
}

export function validationSummary(issues: PlanValidationIssue[]) {
  if (issues.length === 0) return '';
  return issues.slice(0, 5).map((issue) => issue.message).join(' ');
}
