CREATE TYPE "PillarType" AS ENUM ('MASTER', 'LOCAL');
CREATE TYPE "RecordStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'RETURNED', 'ARCHIVED');
CREATE TYPE "PillarAllocationStatus" AS ENUM ('INDICATIVE', 'REQUESTED', 'APPROVED', 'RETURNED', 'CLOSED');
CREATE TYPE "AppraisalStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'SELF_REVIEW', 'MANAGER_REVIEW', 'COMPLETED', 'CANCELLED');

CREATE TABLE "StrategicPlan" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL DEFAULT '',
  "startYear" INTEGER NOT NULL, "endYear" INTEGER NOT NULL, "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT',
  "sourceReference" TEXT NOT NULL DEFAULT '', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StrategicPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StrategicPlan_status_idx" ON "StrategicPlan"("status");
CREATE INDEX "StrategicPlan_startYear_endYear_idx" ON "StrategicPlan"("startYear", "endYear");

CREATE TABLE "StrategicPillar" (
  "id" TEXT NOT NULL, "strategicPlanId" TEXT, "parentPillarId" TEXT, "ownerDepartmentId" TEXT,
  "code" TEXT NOT NULL, "title" TEXT NOT NULL, "objective" TEXT NOT NULL DEFAULT '',
  "operationalGuidance" TEXT NOT NULL DEFAULT '', "strategicAlignment" TEXT NOT NULL DEFAULT '',
  "milestones" JSONB, "risks" TEXT NOT NULL DEFAULT '', "partnerGuidance" TEXT NOT NULL DEFAULT '',
  "sourceReference" TEXT NOT NULL DEFAULT '', "type" "PillarType" NOT NULL DEFAULT 'LOCAL',
  "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StrategicPillar_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StrategicPillar_strategicPlanId_code_key" ON "StrategicPillar"("strategicPlanId", "code");
CREATE INDEX "StrategicPillar_type_status_idx" ON "StrategicPillar"("type", "status");
CREATE INDEX "StrategicPillar_ownerDepartmentId_idx" ON "StrategicPillar"("ownerDepartmentId");
CREATE INDEX "StrategicPillar_parentPillarId_idx" ON "StrategicPillar"("parentPillarId");
ALTER TABLE "StrategicPillar" ADD CONSTRAINT "StrategicPillar_strategicPlanId_fkey" FOREIGN KEY ("strategicPlanId") REFERENCES "StrategicPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StrategicPillar" ADD CONSTRAINT "StrategicPillar_parentPillarId_fkey" FOREIGN KEY ("parentPillarId") REFERENCES "StrategicPillar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StrategicPillar" ADD CONSTRAINT "StrategicPillar_ownerDepartmentId_fkey" FOREIGN KEY ("ownerDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PillarBudgetAllocation" (
  "id" TEXT NOT NULL, "pillarId" TEXT NOT NULL, "departmentId" TEXT NOT NULL, "fiscalYear" INTEGER NOT NULL,
  "costCenterCode" TEXT NOT NULL DEFAULT '', "fundingSourceId" TEXT, "indicativeAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "requestedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0, "approvedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "status" "PillarAllocationStatus" NOT NULL DEFAULT 'INDICATIVE', "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PillarBudgetAllocation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PillarBudgetAllocation_departmentId_fiscalYear_idx" ON "PillarBudgetAllocation"("departmentId", "fiscalYear");
CREATE INDEX "PillarBudgetAllocation_pillarId_fiscalYear_idx" ON "PillarBudgetAllocation"("pillarId", "fiscalYear");
CREATE INDEX "PillarBudgetAllocation_status_idx" ON "PillarBudgetAllocation"("status");
ALTER TABLE "PillarBudgetAllocation" ADD CONSTRAINT "PillarBudgetAllocation_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "StrategicPillar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PillarBudgetAllocation" ADD CONSTRAINT "PillarBudgetAllocation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PillarBudgetAllocation" ADD CONSTRAINT "PillarBudgetAllocation_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "FundingSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ActivityPillarFundingSplit" (
  "id" TEXT NOT NULL, "activityId" TEXT NOT NULL, "pillarBudgetAllocationId" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ActivityPillarFundingSplit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ActivityPillarFundingSplit_activityId_pillarBudgetAllocationId_key" ON "ActivityPillarFundingSplit"("activityId", "pillarBudgetAllocationId");
CREATE INDEX "ActivityPillarFundingSplit_pillarBudgetAllocationId_idx" ON "ActivityPillarFundingSplit"("pillarBudgetAllocationId");
ALTER TABLE "ActivityPillarFundingSplit" ADD CONSTRAINT "ActivityPillarFundingSplit_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityPillarFundingSplit" ADD CONSTRAINT "ActivityPillarFundingSplit_pillarBudgetAllocationId_fkey" FOREIGN KEY ("pillarBudgetAllocationId") REFERENCES "PillarBudgetAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "JobDescription" (
  "id" TEXT NOT NULL, "departmentId" TEXT, "code" TEXT NOT NULL, "title" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "purpose" TEXT NOT NULL DEFAULT '', "reportsTo" TEXT NOT NULL DEFAULT '', "supervises" TEXT NOT NULL DEFAULT '',
  "contacts" TEXT NOT NULL DEFAULT '', "specialConditions" TEXT NOT NULL DEFAULT '', "selectionCriteria" TEXT NOT NULL DEFAULT '',
  "sourceReference" TEXT NOT NULL DEFAULT '', "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT',
  "effectiveFrom" TIMESTAMP(3), "effectiveTo" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "JobDescription_departmentId_code_version_key" ON "JobDescription"("departmentId", "code", "version");
CREATE INDEX "JobDescription_departmentId_status_idx" ON "JobDescription"("departmentId", "status");
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "JobDescriptionObjective" (
  "id" TEXT NOT NULL, "jobDescriptionId" TEXT NOT NULL, "kra" TEXT NOT NULL, "kta" TEXT NOT NULL, "kpi" TEXT NOT NULL,
  "targetDate" TEXT NOT NULL DEFAULT '', "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "JobDescriptionObjective_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobDescriptionObjective_jobDescriptionId_sortOrder_idx" ON "JobDescriptionObjective"("jobDescriptionId", "sortOrder");
ALTER TABLE "JobDescriptionObjective" ADD CONSTRAINT "JobDescriptionObjective_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StaffMember" (
  "id" TEXT NOT NULL, "userId" TEXT, "departmentId" TEXT, "staffNumber" TEXT NOT NULL DEFAULT '', "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL DEFAULT '', "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StaffMember_userId_key" ON "StaffMember"("userId");
CREATE INDEX "StaffMember_departmentId_isActive_idx" ON "StaffMember"("departmentId", "isActive");
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PositionAssignment" (
  "id" TEXT NOT NULL, "staffMemberId" TEXT NOT NULL, "jobDescriptionId" TEXT NOT NULL, "departmentId" TEXT,
  "supervisorName" TEXT NOT NULL DEFAULT '', "startsOn" TIMESTAMP(3) NOT NULL, "endsOn" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PositionAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PositionAssignment_staffMemberId_isActive_idx" ON "PositionAssignment"("staffMemberId", "isActive");
CREATE INDEX "PositionAssignment_departmentId_isActive_idx" ON "PositionAssignment"("departmentId", "isActive");
ALTER TABLE "PositionAssignment" ADD CONSTRAINT "PositionAssignment_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PositionAssignment" ADD CONSTRAINT "PositionAssignment_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PositionAssignment" ADD CONSTRAINT "PositionAssignment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PerformanceAppraisal" (
  "id" TEXT NOT NULL, "positionAssignmentId" TEXT NOT NULL, "reviewerId" TEXT, "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL, "status" "AppraisalStatus" NOT NULL DEFAULT 'DRAFT', "developmentPlan" TEXT NOT NULL DEFAULT '',
  "overallComment" TEXT NOT NULL DEFAULT '', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PerformanceAppraisal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PerformanceAppraisal_positionAssignmentId_status_idx" ON "PerformanceAppraisal"("positionAssignmentId", "status");
CREATE INDEX "PerformanceAppraisal_reviewerId_idx" ON "PerformanceAppraisal"("reviewerId");
ALTER TABLE "PerformanceAppraisal" ADD CONSTRAINT "PerformanceAppraisal_positionAssignmentId_fkey" FOREIGN KEY ("positionAssignmentId") REFERENCES "PositionAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PerformanceAppraisal" ADD CONSTRAINT "PerformanceAppraisal_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AppraisalObjective" (
  "id" TEXT NOT NULL, "appraisalId" TEXT NOT NULL, "kra" TEXT NOT NULL, "kta" TEXT NOT NULL, "kpi" TEXT NOT NULL,
  "targetDate" TEXT NOT NULL DEFAULT '', "evidence" TEXT NOT NULL DEFAULT '', "rating" INTEGER, "reviewerComment" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "AppraisalObjective_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AppraisalObjective_appraisalId_sortOrder_idx" ON "AppraisalObjective"("appraisalId", "sortOrder");
ALTER TABLE "AppraisalObjective" ADD CONSTRAINT "AppraisalObjective_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "PerformanceAppraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
