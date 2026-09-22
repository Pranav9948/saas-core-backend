-- AlterTable
ALTER TABLE "membership_packages" ADD COLUMN "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
