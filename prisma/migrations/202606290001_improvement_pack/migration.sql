-- Improvement Pack: notifications, export history, and added audit actions.
DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SNAPSHOT_EXPORTED';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PASSWORD_CHANGED';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NOTIFICATION_READ';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessPlanId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExportHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "businessPlanId" TEXT,
  "snapshotId" TEXT,
  "exportType" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExportHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_businessPlanId_idx" ON "Notification"("businessPlanId");
CREATE INDEX IF NOT EXISTS "Notification_readAt_idx" ON "Notification"("readAt");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE INDEX IF NOT EXISTS "ExportHistory_userId_idx" ON "ExportHistory"("userId");
CREATE INDEX IF NOT EXISTS "ExportHistory_businessPlanId_idx" ON "ExportHistory"("businessPlanId");
CREATE INDEX IF NOT EXISTS "ExportHistory_snapshotId_idx" ON "ExportHistory"("snapshotId");
CREATE INDEX IF NOT EXISTS "ExportHistory_exportType_idx" ON "ExportHistory"("exportType");
CREATE INDEX IF NOT EXISTS "ExportHistory_createdAt_idx" ON "ExportHistory"("createdAt");

DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ExportHistory" ADD CONSTRAINT "ExportHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ExportHistory" ADD CONSTRAINT "ExportHistory_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
