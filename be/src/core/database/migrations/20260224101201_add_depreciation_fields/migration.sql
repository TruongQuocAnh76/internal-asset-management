/*
  Warnings:

  - Made the column `costs` on table `AssetItems` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."DepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'DECLINING_BALANCE');

-- AlterTable
ALTER TABLE "public"."AssetItems" ALTER COLUMN "costs" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Assets" ADD COLUMN     "decline_balance_rate" INTEGER,
ADD COLUMN     "depreciation_method" "public"."DepreciationMethod",
ADD COLUMN     "life_months" INTEGER,
ADD COLUMN     "salvage_value" BIGINT;

-- AlterTable
ALTER TABLE "public"."AssetsCategories" ADD COLUMN     "decline_balance_rate" INTEGER,
ADD COLUMN     "default_depreciation_method" "public"."DepreciationMethod",
ADD COLUMN     "default_life_months" INTEGER,
ADD COLUMN     "salvage_value" BIGINT;
