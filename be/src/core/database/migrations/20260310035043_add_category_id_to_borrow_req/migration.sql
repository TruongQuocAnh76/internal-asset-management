-- AlterTable
ALTER TABLE "public"."BorrowRequests" ADD COLUMN     "category_id" UUID;

-- AddForeignKey
ALTER TABLE "public"."BorrowRequests" ADD CONSTRAINT "BorrowRequests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."AssetsCategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
