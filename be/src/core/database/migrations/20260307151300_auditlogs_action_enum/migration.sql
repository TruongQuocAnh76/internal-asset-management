/*
  Warnings:

  - Changed the type of `action` on the `AuditLogs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
-- convert column
ALTER TABLE "AuditLogs"
ALTER COLUMN "action"
TYPE "AuditAction"
USING "action"::"AuditAction";
-- ALTER TABLE "public"."AuditLogs" DROP COLUMN "action",
-- ADD COLUMN     "action" "public"."AuditAction" NOT NULL;
