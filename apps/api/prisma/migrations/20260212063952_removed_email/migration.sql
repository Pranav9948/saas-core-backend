/*
  Warnings:

  - You are about to drop the column `email` on the `trainers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "trainers_email_key";

-- AlterTable
ALTER TABLE "trainers" DROP COLUMN "email";
