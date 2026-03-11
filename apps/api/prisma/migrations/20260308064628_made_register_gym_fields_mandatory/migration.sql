/*
  Warnings:

  - Made the column `address` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contact_email` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contact_phone` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `tenants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timezone` on table `tenants` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tenants" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "contact_email" SET NOT NULL,
ALTER COLUMN "contact_phone" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "timezone" SET NOT NULL;
