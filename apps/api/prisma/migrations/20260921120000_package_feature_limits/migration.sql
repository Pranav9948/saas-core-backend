-- AlterTable
ALTER TABLE "membership_packages" ADD COLUMN "feature_limits" JSONB NOT NULL DEFAULT '{}'::jsonb;
