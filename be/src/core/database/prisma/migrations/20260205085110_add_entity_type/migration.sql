/*
  Warnings:

  - Changed the type of `entity_type` on the `AuditLogs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."Entity" AS ENUM ('ASSET', 'USER', 'CATEGORY', 'BORROW_REQUEST', 'ASSET_ALLOCATION');

-- AlterTable
ALTER TABLE "public"."AuditLogs" DROP COLUMN "entity_type",
ADD COLUMN     "entity_type" "public"."Entity" NOT NULL;
