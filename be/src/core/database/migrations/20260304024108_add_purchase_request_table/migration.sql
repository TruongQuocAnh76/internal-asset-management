-- CreateEnum
CREATE TYPE "public"."PurchaseRequestStatus" AS ENUM ('SUBMITTED', 'TL_APPROVED', 'BOD_APPROVED', 'REJECTED', 'RECEIVED');

-- CreateTable
CREATE TABLE "public"."PurchaseRequest" (
    "id" UUID NOT NULL,
    "reason" TEXT,
    "asset_category_id" UUID NOT NULL,
    "specs" JSONB NOT NULL,
    "requested_by" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimated_cost" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."PurchaseRequestStatus" NOT NULL DEFAULT 'SUBMITTED',

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_asset_category_id_fkey" FOREIGN KEY ("asset_category_id") REFERENCES "public"."AssetsCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
