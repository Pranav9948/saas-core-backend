-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('GAIN', 'LOSS');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateTable
CREATE TABLE "member_goals" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "currentWeight" DOUBLE PRECISION NOT NULL,
    "targetWeight" DOUBLE PRECISION NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "version" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_days" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_master" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "caloriesPerUnit" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_logs" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diet_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_log_items" (
    "id" UUID NOT NULL,
    "dietLogId" UUID NOT NULL,
    "foodId" UUID NOT NULL,
    "mealType" "MealType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diet_log_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "exercise" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_goals_memberId_idx" ON "member_goals"("memberId");

-- CreateIndex
CREATE INDEX "member_goals_tenantId_memberId_idx" ON "member_goals"("tenantId", "memberId");

-- CreateIndex
CREATE INDEX "workout_plans_memberId_idx" ON "workout_plans"("memberId");

-- CreateIndex
CREATE INDEX "workout_plans_tenantId_memberId_idx" ON "workout_plans"("tenantId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "workout_days_planId_dayNumber_key" ON "workout_days"("planId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "food_master_name_unit_key" ON "food_master"("name", "unit");

-- CreateIndex
CREATE INDEX "diet_logs_memberId_date_idx" ON "diet_logs"("memberId", "date");

-- CreateIndex
CREATE INDEX "diet_logs_tenantId_memberId_idx" ON "diet_logs"("tenantId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "diet_logs_memberId_date_key" ON "diet_logs"("memberId", "date");

-- CreateIndex
CREATE INDEX "diet_log_items_dietLogId_idx" ON "diet_log_items"("dietLogId");

-- CreateIndex
CREATE INDEX "workout_logs_memberId_date_idx" ON "workout_logs"("memberId", "date");

-- CreateIndex
CREATE INDEX "workout_logs_tenantId_memberId_idx" ON "workout_logs"("tenantId", "memberId");

-- CreateIndex
CREATE INDEX "weight_logs_tenantId_memberId_idx" ON "weight_logs"("tenantId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "weight_logs_memberId_date_key" ON "weight_logs"("memberId", "date");

-- AddForeignKey
ALTER TABLE "member_goals" ADD CONSTRAINT "member_goals_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_goals" ADD CONSTRAINT "member_goals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "workout_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "workout_days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_logs" ADD CONSTRAINT "diet_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_logs" ADD CONSTRAINT "diet_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_log_items" ADD CONSTRAINT "diet_log_items_dietLogId_fkey" FOREIGN KEY ("dietLogId") REFERENCES "diet_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_log_items" ADD CONSTRAINT "diet_log_items_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "food_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
