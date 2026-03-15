/*
  Warnings:

  - A unique constraint covering the columns `[direct_key]` on the table `ChatRooms` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."ChatRooms" ADD COLUMN     "direct_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChatRooms_direct_key_key" ON "public"."ChatRooms"("direct_key");

-- CreateIndex
CREATE INDEX "ChatRooms_direct_key_idx" ON "public"."ChatRooms"("direct_key");

ALTER TABLE "public"."ChatRooms" ADD CONSTRAINT "direct_key_direct_only_check" CHECK (
  (direct_key IS NOT NULL AND type = 'DIRECT') OR
  (direct_key IS NULL AND type != 'DIRECT')
);