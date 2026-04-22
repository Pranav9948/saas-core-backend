/*
  Warnings:

  - You are about to drop the column `maxMembers` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `maxTrainers` on the `Plan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "maxMembers",
DROP COLUMN "maxTrainers";
