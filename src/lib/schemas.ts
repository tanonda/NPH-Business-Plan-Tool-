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
  budgetCategory: z.string().default('Operations'),
  accountCode: z.string().default(''),
  sortOrder: z.coerce.number().default(0)
});

export const PlanSchema = z.object({
  title: z.string().min(1),
  organization: z.string().default('Ministry of Health'),
  facility: z.string().default('Vila Central Hospital'),
  costCenter: z.string().default('61RB'),
  costCenterName: z.string().default('Vila Central Hospital'),
  year: z.coerce.number().int().default(2026),
  ceilingAmount: z.coerce.number().nonnegative().default(0),
  activities: z.array(ActivitySchema).default([])
});
