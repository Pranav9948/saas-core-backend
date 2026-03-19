/*
  Warnings:

  - A unique constraint covering the columns `[member_id,date]` on the table `attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,tenant_id]` on the table `trainers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "date" DATE NOT NULL;

-- CreateTable
CREATE TABLE "super_admins" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admin_refresh_tokens" (
    "id" UUID NOT NULL,
    "super_admin_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "super_admin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "super_admin_refresh_tokens_token_key" ON "super_admin_refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_member_id_date_key" ON "attendance"("member_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "trainers_user_id_tenant_id_key" ON "trainers"("user_id", "tenant_id");

-- AddForeignKey
ALTER TABLE "super_admin_refresh_tokens" ADD CONSTRAINT "super_admin_refresh_tokens_super_admin_id_fkey" FOREIGN KEY ("super_admin_id") REFERENCES "super_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
