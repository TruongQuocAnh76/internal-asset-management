-- CreateEnum
CREATE TYPE "public"."BorrowPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "public"."BorrowRequests" ADD COLUMN     "priority" "public"."BorrowPriority" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "reason" TEXT;
