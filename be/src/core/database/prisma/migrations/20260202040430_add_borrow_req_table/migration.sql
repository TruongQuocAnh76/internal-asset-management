-- CreateEnum
CREATE TYPE "public"."BorrowStatus" AS ENUM ('PENDING', 'PROVIDED', 'APPROVED', 'REJECTED', 'RETURNED');

-- CreateTable
CREATE TABLE "public"."BorrowRequests" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."BorrowStatus" NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "approved_by" UUID,
    "provided_at" TIMESTAMP(3),
    "provided_by" UUID,
    "returned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BorrowRequests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BorrowRequests" ADD CONSTRAINT "BorrowRequests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowRequests" ADD CONSTRAINT "BorrowRequests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
