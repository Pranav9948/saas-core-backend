-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "maxMembers" INTEGER,
ADD COLUMN     "maxTrainers" INTEGER;

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);
