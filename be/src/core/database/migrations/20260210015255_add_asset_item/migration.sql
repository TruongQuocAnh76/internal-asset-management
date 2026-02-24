/*
  Warnings:

  - You are about to drop the column `kit_id` on the `Assets` table. All the data in the column will be lost.
  - You are about to drop the column `kit_status` on the `Assets` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Assets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Assets" DROP COLUMN "kit_id",
DROP COLUMN "kit_status",
DROP COLUMN "stock";

-- CreateTable
CREATE TABLE "public"."AssetItems" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'READY',
    "location_name" TEXT,
    "costs" BIGINT,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kit_id" UUID,
    "kit_status" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetItems_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AssetItems" ADD CONSTRAINT "AssetItems_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."Assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetItems" ADD CONSTRAINT "AssetItems_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "public"."AssetsKits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
