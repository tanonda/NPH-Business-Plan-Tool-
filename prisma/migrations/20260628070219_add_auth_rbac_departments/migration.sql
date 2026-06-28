-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DIRECTOR', 'PLANNER', 'REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "DepartmentAccessLevel" AS ENUM ('OWNER', 'EDITOR', 'REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('PLAN_CREATED', 'PLAN_UPDATED', 'PLAN_DELETED', 'STATUS_DRAFT', 'STATUS_REVIEW', 'STATUS_APPROVED', 'STATUS_SUBMITTED', 'APPROVAL_COMMENT', 'VERSION_SNAPSHOT_SUBMITTED', 'VERSION_SNAPSHOT_APPROVED', 'EXCEL_IMPORTED', 'EXCEL_EXPORTED', 'EXECUTIVE_REPORT_VIEWED', 'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DISABLED', 'DEPARTMENT_ACCESS_GRANTED', 'DEPARTMENT_ACCESS_REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLANNER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canAccessAllDepartments" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL DEFAULT 'Ministry of Health',
    "facility" TEXT,
    "costCenter" TEXT,
    "costCenterName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDepartmentAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "accessLevel" "DepartmentAccessLevel" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDepartmentAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL DEFAULT 'Ministry of Health',
    "year" INTEGER NOT NULL,
    "facility" TEXT NOT NULL,
    "costCenter" TEXT NOT NULL,
    "costCenterName" TEXT NOT NULL,
    "ceilingAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "departmentId" TEXT,
    "ownerId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "businessPlanId" TEXT NOT NULL,
    "subProgram" TEXT NOT NULL,
    "corporatePlanKeyActivity" TEXT NOT NULL DEFAULT '',
    "outputOrServiceTarget" TEXT NOT NULL DEFAULT '',
    "targetForYear" TEXT NOT NULL DEFAULT '',
    "responsibility" TEXT NOT NULL DEFAULT '',
    "activityNumber" TEXT NOT NULL,
    "activityDescription" TEXT NOT NULL,
    "jobCode" TEXT NOT NULL DEFAULT '',
    "expenditureDescription" TEXT NOT NULL DEFAULT '',
    "estimatedCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "recurrentBudget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "developmentPartners" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "q1" BOOLEAN NOT NULL DEFAULT false,
    "q2" BOOLEAN NOT NULL DEFAULT false,
    "q3" BOOLEAN NOT NULL DEFAULT false,
    "q4" BOOLEAN NOT NULL DEFAULT false,
    "funding" TEXT NOT NULL DEFAULT 'Recurrent',
    "budgetCategory" TEXT NOT NULL DEFAULT 'Operations',
    "accountCode" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "businessPlanId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalComment" (
    "id" TEXT NOT NULL,
    "businessPlanId" TEXT NOT NULL,
    "userId" TEXT,
    "comment" TEXT NOT NULL,
    "statusAtTime" "PlanStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionSnapshot" (
    "id" TEXT NOT NULL,
    "businessPlanId" TEXT NOT NULL,
    "capturedById" TEXT,
    "status" "PlanStatus" NOT NULL,
    "label" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_code_idx" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_isActive_idx" ON "Department"("isActive");

-- CreateIndex
CREATE INDEX "UserDepartmentAccess_departmentId_idx" ON "UserDepartmentAccess"("departmentId");

-- CreateIndex
CREATE INDEX "UserDepartmentAccess_accessLevel_idx" ON "UserDepartmentAccess"("accessLevel");

-- CreateIndex
CREATE UNIQUE INDEX "UserDepartmentAccess_userId_departmentId_key" ON "UserDepartmentAccess"("userId", "departmentId");

-- CreateIndex
CREATE INDEX "BusinessPlan_year_idx" ON "BusinessPlan"("year");

-- CreateIndex
CREATE INDEX "BusinessPlan_status_idx" ON "BusinessPlan"("status");

-- CreateIndex
CREATE INDEX "BusinessPlan_departmentId_idx" ON "BusinessPlan"("departmentId");

-- CreateIndex
CREATE INDEX "BusinessPlan_costCenter_idx" ON "BusinessPlan"("costCenter");

-- CreateIndex
CREATE INDEX "BusinessPlan_ownerId_idx" ON "BusinessPlan"("ownerId");

-- CreateIndex
CREATE INDEX "Activity_businessPlanId_idx" ON "Activity"("businessPlanId");

-- CreateIndex
CREATE INDEX "Activity_activityNumber_idx" ON "Activity"("activityNumber");

-- CreateIndex
CREATE INDEX "Activity_subProgram_idx" ON "Activity"("subProgram");

-- CreateIndex
CREATE INDEX "Activity_sortOrder_idx" ON "Activity"("sortOrder");

-- CreateIndex
CREATE INDEX "AuditLog_businessPlanId_idx" ON "AuditLog"("businessPlanId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApprovalComment_businessPlanId_idx" ON "ApprovalComment"("businessPlanId");

-- CreateIndex
CREATE INDEX "ApprovalComment_userId_idx" ON "ApprovalComment"("userId");

-- CreateIndex
CREATE INDEX "ApprovalComment_createdAt_idx" ON "ApprovalComment"("createdAt");

-- CreateIndex
CREATE INDEX "VersionSnapshot_businessPlanId_idx" ON "VersionSnapshot"("businessPlanId");

-- CreateIndex
CREATE INDEX "VersionSnapshot_capturedById_idx" ON "VersionSnapshot"("capturedById");

-- CreateIndex
CREATE INDEX "VersionSnapshot_status_idx" ON "VersionSnapshot"("status");

-- CreateIndex
CREATE INDEX "VersionSnapshot_createdAt_idx" ON "VersionSnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDepartmentAccess" ADD CONSTRAINT "UserDepartmentAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDepartmentAccess" ADD CONSTRAINT "UserDepartmentAccess_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPlan" ADD CONSTRAINT "BusinessPlan_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPlan" ADD CONSTRAINT "BusinessPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPlan" ADD CONSTRAINT "BusinessPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPlan" ADD CONSTRAINT "BusinessPlan_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalComment" ADD CONSTRAINT "ApprovalComment_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalComment" ADD CONSTRAINT "ApprovalComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionSnapshot" ADD CONSTRAINT "VersionSnapshot_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionSnapshot" ADD CONSTRAINT "VersionSnapshot_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
