/*
  Warnings:

  - A unique constraint covering the columns `[asset_id]` on the table `AssetsAllocation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kit_id]` on the table `AssetsAllocation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AssetsAllocation_asset_id_key" ON "public"."AssetsAllocation"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssetsAllocation_kit_id_key" ON "public"."AssetsAllocation"("kit_id");
