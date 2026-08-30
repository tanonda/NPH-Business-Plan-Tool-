import { z } from 'zod';

export const ActivityPillarFundingSplitSchema = z.object({
  pillarBudgetAllocationId: z.string().trim().min(1),
  amount: z.coerce.number().positive()
});

export const ActivitySchema = z.object({
  subProgram: z.string().default(''),
  corporatePlanKeyActivity: z.string().default(''),
  outputOrServiceTarget: z.string().default(''),
  targetForYear: z.string().default(''),
  responsibility: z.string().default(''),
  activityNumber: z.string().default(''),
  activityDescription: z.string().min(1),
  jobCode: z.string().default(''),
  expenditureDescription: z.string().min(1),
  estimatedCost: z.coerce.number().nonnegative(),
  recurrentBudget: z.coerce.number().nonnegative(),
  developmentPartners: z.coerce.number().nonnegative().default(0),
  q1: z.boolean().default(false),
  q2: z.boolean().default(false),
  q3: z.boolean().default(false),
  q4: z.boolean().default(false),
  funding: z.string().default('Recurrent'),
  budgetCategory: z.string().default('Admin'),
  accountCode: z.string().default(''),
  costCenterCode: z.string().default(''),
  nsdpTarget: z.string().default(''),
  activityCategory: z.string().default(''),
  fundingSourceId: z.string().trim().optional().nullable(),
  pillarFundingSplits: z.array(ActivityPillarFundingSplitSchema).default([]),
  approvedBudget: z.coerce.number().nonnegative().default(0),
  sortOrder: z.coerce.number().default(0)
});

export const PlanSchema = z.object({
  title: z.string().min(1),
  organization: z.string().default('Ministry of Health'),
  facility: z.string().default('Vila Central Hospital'),
  costCenter: z.string().default('61RB'),
  costCenterName: z.string().default('Vila Central Hospital'),
  departmentId: z.string().trim().optional().nullable(),
  year: z.coerce.number().int().default(2026),
  ceilingAmount: z.coerce.number().nonnegative().default(0),
  ceilingJustification: z.string().trim().optional().default(''),
  activities: z.array(ActivitySchema).default([])
});

export const CommitmentSchema = z.object({
  businessPlanId: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
  costCenterCode: z.string().trim().min(1, 'Cost center is required'),
  accountCodeText: z.string().trim().min(1, 'Account code is required'),
  lpoNumber: z.string().trim().optional().default(''),
  supplier: z.string().trim().optional().default(''),
  description: z.string().trim().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Commitment amount must be greater than zero'),
  status: z.enum(['DRAFT', 'COMMITTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).default('COMMITTED'),
  committedDate: z.coerce.date().optional()
});

export const ExpenditureSchema = z.object({
  businessPlanId: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
  costCenterCode: z.string().trim().min(1, 'Cost center is required'),
  accountCodeText: z.string().trim().min(1, 'Account code is required'),
  voucherNumber: z.string().trim().optional().default(''),
  invoiceNumber: z.string().trim().optional().default(''),
  supplier: z.string().trim().optional().default(''),
  description: z.string().trim().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Expenditure amount must be greater than zero'),
  expenditureDate: z.coerce.date().optional(),
  sourceSystem: z.string().trim().optional().default('MANUAL')
});

export const DepartmentBudgetCeilingSchema = z.object({
  fiscalYear: z.coerce.number().int(),
  departmentId: z.string().optional().nullable(),
  costCenterCode: z.string().trim().min(1),
  approvedCeiling: z.coerce.number().nonnegative().default(0),
  supplementary: z.coerce.number().nonnegative().default(0),
  virementsIn: z.coerce.number().nonnegative().default(0),
  virementsOut: z.coerce.number().nonnegative().default(0),
  restrictedFunds: z.coerce.number().nonnegative().default(0),
  withdrawnFunds: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional().default('')
});

export const StrategicPillarSchema = z.object({
  strategicPlanId: z.string().trim().optional().nullable(),
  parentPillarId: z.string().trim().optional().nullable(),
  ownerDepartmentId: z.string().trim().optional().nullable(),
  code: z.string().trim().min(1),
  title: z.string().trim().min(1),
  objective: z.string().trim().default(''),
  operationalGuidance: z.string().trim().default(''),
  strategicAlignment: z.string().trim().default(''),
  risks: z.string().trim().default(''),
  partnerGuidance: z.string().trim().default(''),
  sourceReference: z.string().trim().default(''),
  type: z.enum(['MASTER', 'LOCAL']).default('LOCAL'),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'RETURNED', 'ARCHIVED']).default('DRAFT')
});

export const PillarBudgetAllocationSchema = z.object({
  pillarId: z.string().trim().min(1),
  departmentId: z.string().trim().min(1),
  fiscalYear: z.coerce.number().int(),
  costCenterCode: z.string().trim().default(''),
  fundingSourceId: z.string().trim().optional().nullable(),
  indicativeAmount: z.coerce.number().nonnegative().default(0),
  requestedAmount: z.coerce.number().nonnegative().default(0),
  approvedAmount: z.coerce.number().nonnegative().default(0),
  status: z.enum(['INDICATIVE', 'REQUESTED', 'APPROVED', 'RETURNED', 'CLOSED']).default('INDICATIVE'),
  notes: z.string().trim().default('')
});

export const JobDescriptionSchema = z.object({
  departmentId: z.string().trim().optional().nullable(),
  code: z.string().trim().min(1),
  title: z.string().trim().min(1),
  version: z.coerce.number().int().positive().default(1),
  purpose: z.string().trim().default(''),
  reportsTo: z.string().trim().default(''),
  supervises: z.string().trim().default(''),
  contacts: z.string().trim().default(''),
  specialConditions: z.string().trim().default(''),
  selectionCriteria: z.string().trim().default(''),
  sourceReference: z.string().trim().default(''),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'RETURNED', 'ARCHIVED']).default('DRAFT'),
  objectives: z.array(z.object({ kra: z.string().trim().min(1), kta: z.string().trim().min(1), kpi: z.string().trim().min(1), targetDate: z.string().trim().default('') })).default([])
});

export const StaffMemberSchema = z.object({
  departmentId: z.string().trim().optional().nullable(),
  staffNumber: z.string().trim().default(''),
  fullName: z.string().trim().min(1),
  email: z.string().trim().email().or(z.literal('')).default('')
});

export const PositionAssignmentSchema = z.object({
  staffMemberId: z.string().trim().min(1),
  jobDescriptionId: z.string().trim().min(1),
  departmentId: z.string().trim().optional().nullable(),
  supervisorName: z.string().trim().default(''),
  startsOn: z.coerce.date(),
  endsOn: z.coerce.date().optional().nullable()
});

export const PerformanceAppraisalSchema = z.object({
  positionAssignmentId: z.string().trim().min(1),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  developmentPlan: z.string().trim().default(''),
  overallComment: z.string().trim().default('')
});
