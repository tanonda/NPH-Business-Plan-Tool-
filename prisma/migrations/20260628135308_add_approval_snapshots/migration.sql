-- CreateTable
CREATE TABLE "ApprovalSnapshot" (
    "id" TEXT NOT NULL,
    "businessPlanId" TEXT NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "facility" TEXT,
    "departmentId" TEXT,
    "departmentName" TEXT,
    "totalEstimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recurrentCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unfundedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activityCount" INTEGER NOT NULL DEFAULT 0,
    "snapshotData" JSONB NOT NULL,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalSnapshot_businessPlanId_idx" ON "ApprovalSnapshot"("businessPlanId");

-- CreateIndex
CREATE INDEX "ApprovalSnapshot_snapshotType_idx" ON "ApprovalSnapshot"("snapshotType");

-- CreateIndex
CREATE INDEX "ApprovalSnapshot_status_idx" ON "ApprovalSnapshot"("status");

-- CreateIndex
CREATE INDEX "ApprovalSnapshot_createdAt_idx" ON "ApprovalSnapshot"("createdAt");
