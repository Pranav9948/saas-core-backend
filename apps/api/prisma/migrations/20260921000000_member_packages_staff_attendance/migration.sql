-- CreateEnum
CREATE TYPE "MemberPaymentStatus" AS ENUM ('PAID', 'PENDING');

-- CreateTable
CREATE TABLE "membership_packages" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_days" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_packages_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "members" ADD COLUMN "package_id" UUID,
ADD COLUMN "membership_start_date" TIMESTAMP(3),
ADD COLUMN "membership_expires_at" TIMESTAMP(3),
ADD COLUMN "payment_status" "MemberPaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "staff_attendance" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trainer_id" UUID,
    "date" DATE NOT NULL,
    "check_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "check_out" TIMESTAMP(3),
    "present" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_packages_tenant_id_name_key" ON "membership_packages"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "membership_packages_tenant_id_is_active_idx" ON "membership_packages"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "members_tenant_id_package_id_idx" ON "members"("tenant_id", "package_id");

-- CreateIndex
CREATE INDEX "members_tenant_id_membership_expires_at_idx" ON "members"("tenant_id", "membership_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_tenant_id_user_id_date_key" ON "staff_attendance"("tenant_id", "user_id", "date");

-- CreateIndex
CREATE INDEX "staff_attendance_tenant_id_date_idx" ON "staff_attendance"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "staff_attendance_trainer_id_date_idx" ON "staff_attendance"("trainer_id", "date");

-- AddForeignKey
ALTER TABLE "membership_packages" ADD CONSTRAINT "membership_packages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "membership_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
