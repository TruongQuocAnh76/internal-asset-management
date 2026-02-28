-- AlterTable
ALTER TABLE "public"."AssetItems" ADD COLUMN     "last_maintained_at" TIMESTAMP(3),
ADD COLUMN     "maintenance_notes" TEXT;

-- CreateTable
CREATE TABLE "public"."AssetRepairs" (
    "id" UUID NOT NULL,
    "asset_item_id" UUID NOT NULL,
    "cost" BIGINT NOT NULL,
    "description" TEXT,
    "resolved_status" "public"."AssetStatus" NOT NULL DEFAULT 'READY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetRepairs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AssetRepairs" ADD CONSTRAINT "AssetRepairs_asset_item_id_fkey" FOREIGN KEY ("asset_item_id") REFERENCES "public"."AssetItems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

