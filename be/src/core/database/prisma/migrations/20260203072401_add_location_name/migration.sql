/*
  Warnings:

  - You are about to drop the column `location_id` on the `Assets` table. All the data in the column will be lost.
  - Added the required column `location_name` to the `Assets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Assets" DROP COLUMN "location_id",
ADD COLUMN     "location_name" TEXT NOT NULL;
