-- AlterEnum
ALTER TYPE "public"."Entity" ADD VALUE 'ASSET_KIT';

-- DropForeignKey
ALTER TABLE "public"."BorrowRequests" DROP CONSTRAINT "BorrowRequests_asset_id_fkey";

-- AlterTable
ALTER TABLE "public"."BorrowRequests" ADD COLUMN     "kit_id" UUID,
ALTER COLUMN "asset_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."BorrowRequests" ADD CONSTRAINT "BorrowRequests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."Assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowRequests" ADD CONSTRAINT "BorrowRequests_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "public"."AssetsKits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
