import { z } from 'zod';

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
