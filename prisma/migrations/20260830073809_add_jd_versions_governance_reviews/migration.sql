-- CreateTable
CREATE TABLE "GovernanceReview" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "reviewedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescriptionVersion" (
    "id" TEXT NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "departmentId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "reportsTo" TEXT NOT NULL DEFAULT '',
    "supervises" TEXT NOT NULL DEFAULT '',
    "contacts" TEXT NOT NULL DEFAULT '',
    "specialConditions" TEXT NOT NULL DEFAULT '',
    "selectionCriteria" TEXT NOT NULL DEFAULT '',
    "sourceReference" TEXT NOT NULL DEFAULT '',
    "status" "RecordStatus" NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "objectives" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDescriptionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GovernanceReview_entityType_entityId_createdAt_idx" ON "GovernanceReview"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "GovernanceReview_reviewedById_idx" ON "GovernanceReview"("reviewedById");

-- CreateIndex
CREATE INDEX "JobDescriptionVersion_code_version_idx" ON "JobDescriptionVersion"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "JobDescriptionVersion_jobDescriptionId_version_key" ON "JobDescriptionVersion"("jobDescriptionId", "version");

-- AddForeignKey
ALTER TABLE "GovernanceReview" ADD CONSTRAINT "GovernanceReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescriptionVersion" ADD CONSTRAINT "JobDescriptionVersion_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ActivityPillarFundingSplit_activityId_pillarBudgetAllocationId_" RENAME TO "ActivityPillarFundingSplit_activityId_pillarBudgetAllocatio_key";
