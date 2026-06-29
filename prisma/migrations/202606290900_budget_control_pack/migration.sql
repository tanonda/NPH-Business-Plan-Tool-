-- VNH Budget Control Pack: reference data, accounting execution, donor funding, budget ceilings, and expanded workflow.

DO $$ BEGIN ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ACCOUNTING'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FINANCE'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BUDGET_OFFICER'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DONOR_MANAGER'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'RETURNED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'BUDGET_REVIEW'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'FINANCE_REVIEW'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'BUDGET_CLEARED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'EXECUTION'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'REJECTED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'LOCKED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "FundingSourceType" AS ENUM ('GOVERNMENT_RECURRENT','GOVERNMENT_DEVELOPMENT','DONOR_GRANT','DEVELOPMENT_PARTNER','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FundingConfirmationStatus" AS ENUM ('PENDING','CONFIRMED','WITHDRAWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CommitmentStatus" AS ENUM ('DRAFT','COMMITTED','PARTIALLY_PAID','PAID','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "costCenterCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "nsdpTarget" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "activityCategory" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "fundingSourceId" TEXT;
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "approvedBudget" DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE "Activity" ALTER COLUMN "budgetCategory" SET DEFAULT 'Admin';

CREATE TABLE IF NOT EXISTS "ReferenceList" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReferenceList_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReferenceList_key_key" ON "ReferenceList"("key");

CREATE TABLE IF NOT EXISTS "ReferenceItem" (
  "id" TEXT NOT NULL,
  "referenceListId" TEXT NOT NULL,
  "code" TEXT NOT NULL DEFAULT '',
  "label" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReferenceItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ReferenceItem_referenceListId_idx" ON "ReferenceItem"("referenceListId");
CREATE INDEX IF NOT EXISTS "ReferenceItem_code_idx" ON "ReferenceItem"("code");
CREATE INDEX IF NOT EXISTS "ReferenceItem_category_idx" ON "ReferenceItem"("category");
CREATE INDEX IF NOT EXISTS "ReferenceItem_isActive_idx" ON "ReferenceItem"("isActive");

CREATE TABLE IF NOT EXISTS "CostCenter" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "departmentId" TEXT,
  "ministryCode" TEXT NOT NULL DEFAULT 'MOH',
  "facility" TEXT NOT NULL DEFAULT 'Vila Central Hospital',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CostCenter_code_key" ON "CostCenter"("code");
CREATE INDEX IF NOT EXISTS "CostCenter_departmentId_idx" ON "CostCenter"("departmentId");
CREATE INDEX IF NOT EXISTS "CostCenter_isActive_idx" ON "CostCenter"("isActive");

CREATE TABLE IF NOT EXISTS "AccountCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "budgetCategory" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AccountCode_code_key" ON "AccountCode"("code");
CREATE INDEX IF NOT EXISTS "AccountCode_budgetCategory_idx" ON "AccountCode"("budgetCategory");
CREATE INDEX IF NOT EXISTS "AccountCode_isActive_idx" ON "AccountCode"("isActive");

CREATE TABLE IF NOT EXISTS "FundingSource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "FundingSourceType" NOT NULL DEFAULT 'GOVERNMENT_RECURRENT',
  "donorName" TEXT NOT NULL DEFAULT '',
  "confirmationStatus" "FundingConfirmationStatus" NOT NULL DEFAULT 'CONFIRMED',
  "restrictionType" TEXT NOT NULL DEFAULT 'FLEXIBLE',
  "allowedCategories" JSONB,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FundingSource_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FundingSource_type_idx" ON "FundingSource"("type");
CREATE INDEX IF NOT EXISTS "FundingSource_confirmationStatus_idx" ON "FundingSource"("confirmationStatus");
CREATE INDEX IF NOT EXISTS "FundingSource_isActive_idx" ON "FundingSource"("isActive");

CREATE TABLE IF NOT EXISTS "MinistryBudget" (
  "id" TEXT NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "ministryCode" TEXT NOT NULL DEFAULT 'MOH',
  "ministryName" TEXT NOT NULL DEFAULT 'Ministry of Health',
  "approvedCeiling" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "revisedCeiling" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MinistryBudget_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MinistryBudget_fiscalYear_ministryCode_key" ON "MinistryBudget"("fiscalYear", "ministryCode");
CREATE INDEX IF NOT EXISTS "MinistryBudget_fiscalYear_idx" ON "MinistryBudget"("fiscalYear");

CREATE TABLE IF NOT EXISTS "DepartmentBudgetCeiling" (
  "id" TEXT NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "ministryBudgetId" TEXT,
  "departmentId" TEXT,
  "costCenterCode" TEXT NOT NULL,
  "approvedCeiling" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "supplementary" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "virementsIn" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "virementsOut" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "restrictedFunds" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "withdrawnFunds" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "notes" TEXT NOT NULL DEFAULT '',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DepartmentBudgetCeiling_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DepartmentBudgetCeiling_fiscalYear_costCenterCode_key" ON "DepartmentBudgetCeiling"("fiscalYear", "costCenterCode");
CREATE INDEX IF NOT EXISTS "DepartmentBudgetCeiling_departmentId_idx" ON "DepartmentBudgetCeiling"("departmentId");
CREATE INDEX IF NOT EXISTS "DepartmentBudgetCeiling_fiscalYear_idx" ON "DepartmentBudgetCeiling"("fiscalYear");

CREATE TABLE IF NOT EXISTS "BudgetAllocation" (
  "id" TEXT NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "departmentBudgetCeilingId" TEXT,
  "costCenterId" TEXT,
  "fundingSourceId" TEXT,
  "accountCodeId" TEXT,
  "approvedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "revisedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "availableAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BudgetAllocation_fiscalYear_idx" ON "BudgetAllocation"("fiscalYear");
CREATE INDEX IF NOT EXISTS "BudgetAllocation_costCenterId_idx" ON "BudgetAllocation"("costCenterId");
CREATE INDEX IF NOT EXISTS "BudgetAllocation_fundingSourceId_idx" ON "BudgetAllocation"("fundingSourceId");

CREATE TABLE IF NOT EXISTS "BudgetVirement" (
  "id" TEXT NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "fromCostCenterCode" TEXT NOT NULL,
  "toCostCenterCode" TEXT NOT NULL,
  "fromAccountCode" TEXT NOT NULL DEFAULT '',
  "toAccountCode" TEXT NOT NULL DEFAULT '',
  "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BudgetVirement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BudgetVirement_fiscalYear_idx" ON "BudgetVirement"("fiscalYear");
CREATE INDEX IF NOT EXISTS "BudgetVirement_status_idx" ON "BudgetVirement"("status");

CREATE TABLE IF NOT EXISTS "DonorFundAllocation" (
  "id" TEXT NOT NULL,
  "donorName" TEXT NOT NULL,
  "fundingSourceId" TEXT,
  "businessPlanId" TEXT,
  "activityId" TEXT,
  "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "confirmedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "pendingAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "conditions" TEXT NOT NULL DEFAULT '',
  "status" "FundingConfirmationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DonorFundAllocation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DonorFundAllocation_businessPlanId_idx" ON "DonorFundAllocation"("businessPlanId");
CREATE INDEX IF NOT EXISTS "DonorFundAllocation_activityId_idx" ON "DonorFundAllocation"("activityId");
CREATE INDEX IF NOT EXISTS "DonorFundAllocation_status_idx" ON "DonorFundAllocation"("status");

CREATE TABLE IF NOT EXISTS "Commitment" (
  "id" TEXT NOT NULL,
  "businessPlanId" TEXT,
  "activityId" TEXT,
  "costCenterId" TEXT,
  "costCenterCode" TEXT NOT NULL DEFAULT '',
  "accountCodeId" TEXT,
  "accountCodeText" TEXT NOT NULL DEFAULT '',
  "lpoNumber" TEXT NOT NULL DEFAULT '',
  "supplier" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "status" "CommitmentStatus" NOT NULL DEFAULT 'COMMITTED',
  "committedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Commitment_businessPlanId_idx" ON "Commitment"("businessPlanId");
CREATE INDEX IF NOT EXISTS "Commitment_activityId_idx" ON "Commitment"("activityId");
CREATE INDEX IF NOT EXISTS "Commitment_costCenterCode_idx" ON "Commitment"("costCenterCode");
CREATE INDEX IF NOT EXISTS "Commitment_status_idx" ON "Commitment"("status");

CREATE TABLE IF NOT EXISTS "Expenditure" (
  "id" TEXT NOT NULL,
  "businessPlanId" TEXT,
  "activityId" TEXT,
  "costCenterId" TEXT,
  "costCenterCode" TEXT NOT NULL DEFAULT '',
  "accountCodeId" TEXT,
  "accountCodeText" TEXT NOT NULL DEFAULT '',
  "voucherNumber" TEXT NOT NULL DEFAULT '',
  "invoiceNumber" TEXT NOT NULL DEFAULT '',
  "supplier" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "expenditureDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourceSystem" TEXT NOT NULL DEFAULT 'MANUAL',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Expenditure_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Expenditure_businessPlanId_idx" ON "Expenditure"("businessPlanId");
CREATE INDEX IF NOT EXISTS "Expenditure_activityId_idx" ON "Expenditure"("activityId");
CREATE INDEX IF NOT EXISTS "Expenditure_costCenterCode_idx" ON "Expenditure"("costCenterCode");
CREATE INDEX IF NOT EXISTS "Expenditure_expenditureDate_idx" ON "Expenditure"("expenditureDate");

DO $$ BEGIN ALTER TABLE "ReferenceItem" ADD CONSTRAINT "ReferenceItem_referenceListId_fkey" FOREIGN KEY ("referenceListId") REFERENCES "ReferenceList"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DepartmentBudgetCeiling" ADD CONSTRAINT "DepartmentBudgetCeiling_ministryBudgetId_fkey" FOREIGN KEY ("ministryBudgetId") REFERENCES "MinistryBudget"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DepartmentBudgetCeiling" ADD CONSTRAINT "DepartmentBudgetCeiling_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_departmentBudgetCeilingId_fkey" FOREIGN KEY ("departmentBudgetCeilingId") REFERENCES "DepartmentBudgetCeiling"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "FundingSource"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_accountCodeId_fkey" FOREIGN KEY ("accountCodeId") REFERENCES "AccountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DonorFundAllocation" ADD CONSTRAINT "DonorFundAllocation_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "FundingSource"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DonorFundAllocation" ADD CONSTRAINT "DonorFundAllocation_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_accountCodeId_fkey" FOREIGN KEY ("accountCodeId") REFERENCES "AccountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_accountCodeId_fkey" FOREIGN KEY ("accountCodeId") REFERENCES "AccountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
