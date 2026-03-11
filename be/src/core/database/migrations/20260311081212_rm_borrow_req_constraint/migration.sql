/*
  Warnings:

  - You are about to drop the `AssetsEvents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AssetsEvents" DROP CONSTRAINT "AssetsEvents_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssetsEvents" DROP CONSTRAINT "AssetsEvents_asset_id_fkey";

-- DropTable
DROP TABLE "public"."AssetsEvents";
