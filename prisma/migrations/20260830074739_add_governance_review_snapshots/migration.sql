/*
  Warnings:

  - Added the required column `snapshot` to the `GovernanceReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GovernanceReview" ADD COLUMN     "snapshot" JSONB NOT NULL;
