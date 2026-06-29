import { toNumber } from '@/lib/business-plan-engine';
import { DEFAULT_REFERENCE_DATA } from '@/lib/reference-data';

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

const validFunding = new Set(DEFAULT_REFERENCE_DATA.fundingSources.map((x) => String(x).trim()).filter(Boolean));
const validBudgetCategory = new Set(DEFAULT_REFERENCE_DATA.budgetCategories.map((x) => String(x).trim()).filter(Boolean));
const validActivityCategory = new Set(DEFAULT_REFERENCE_DATA.activityCategories.map((x) => String(x).trim()).filter(Boolean));
const validNsdpTargets = new Set(DEFAULT_REFERENCE_DATA.nsdpTargets.map((x) => String(x).trim()).filter(Boolean));
const validJobCodes = new Set(DEFAULT_REFERENCE_DATA.departments.map((x) => String(x.jobCode).trim()).filter(Boolean));
const accountByDisplay = new Map(DEFAULT_REFERENCE_DATA.accountCodes.map((x) => [String(x.display).trim(), x]));
const accountByCode = new Map(DEFAULT_REFERENCE_DATA.accountCodes.map((x) => [String(x.code).trim(), x]));

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
    const activityNumber = clean(activity.activityNumber);
    const jobCode = clean(activity.jobCode);
    const accountCode = clean(activity.accountCode);
    const budgetCategory = clean(activity.budgetCategory);
    const funding = clean(activity.funding);
    const activityCategory = clean(activity.activityCategory);
    const nsdpTarget = clean(activity.nsdpTarget);

    if (!clean(activity.subProgram)) issues.push({ path: `${label}.subProgram`, message: `Activity ${index + 1}: sub-program is required.` });
    if (!activityNumber) issues.push({ path: `${label}.activityNumber`, message: `Activity ${index + 1}: activity number is required.` });
    if (!clean(activity.activityDescription)) issues.push({ path: `${label}.activityDescription`, message: `Activity ${index + 1}: activity description is required.` });
    if (!clean(activity.expenditureDescription)) issues.push({ path: `${label}.expenditureDescription`, message: `Activity ${index + 1}: expenditure description is required.` });
    if (!clean(activity.responsibility)) issues.push({ path: `${label}.responsibility`, message: `Activity ${index + 1}: responsibility is required.` });
    if (!jobCode) issues.push({ path: `${label}.jobCode`, message: `Activity ${index + 1}: job code/cost center reference is required.` });
    if (jobCode && !validJobCodes.has(jobCode)) issues.push({ path: `${label}.jobCode`, message: `Activity ${index + 1}: job code must come from the workbook Lists tab/reference data.` });
    if (!funding) issues.push({ path: `${label}.funding`, message: `Activity ${index + 1}: funding source is required.` });
    if (funding && validFunding.size > 0 && !validFunding.has(funding)) issues.push({ path: `${label}.funding`, message: `Activity ${index + 1}: funding source is not in the approved reference list.` });
    if (!budgetCategory) issues.push({ path: `${label}.budgetCategory`, message: `Activity ${index + 1}: budget category is required.` });
    if (budgetCategory && validBudgetCategory.size > 0 && !validBudgetCategory.has(budgetCategory)) issues.push({ path: `${label}.budgetCategory`, message: `Activity ${index + 1}: budget category is not in the approved reference list.` });
    if (!accountCode) issues.push({ path: `${label}.accountCode`, message: `Activity ${index + 1}: account code is required.` });

    const account = accountByDisplay.get(accountCode) || accountByCode.get(accountCode.split(' - ')[0]);
    if (accountCode && !account) issues.push({ path: `${label}.accountCode`, message: `Activity ${index + 1}: account code is not in the workbook Lists tab/reference data.` });
    if (account && budgetCategory && account.category !== budgetCategory && budgetCategory !== 'Other Codes Not Listed') {
      issues.push({ path: `${label}.accountCode`, message: `Activity ${index + 1}: account code ${account.code} belongs to ${account.category}, not ${budgetCategory}.` });
    }

    if (activityCategory && validActivityCategory.size > 0 && !validActivityCategory.has(activityCategory)) issues.push({ path: `${label}.activityCategory`, message: `Activity ${index + 1}: activity categorisation is not in the reference list.` });
    if (nsdpTarget && validNsdpTargets.size > 0 && !validNsdpTargets.has(nsdpTarget)) issues.push({ path: `${label}.nsdpTarget`, message: `Activity ${index + 1}: NSDP target is not in the reference list.` });

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
