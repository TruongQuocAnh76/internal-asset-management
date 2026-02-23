/*
  Warnings:

  - You are about to drop the column `costs` on the `Assets` table. All the data in the column will be lost.
  - You are about to drop the column `location_name` on the `Assets` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `AssetsKits` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `AssetsKits` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `AssetsKitsItems` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `template_id` to the `AssetsKits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."Entity" ADD VALUE 'KIT_ITEM';

-- DropForeignKey
ALTER TABLE "public"."AssetsKitsItems" DROP CONSTRAINT "AssetsKitsItems_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssetsKitsItems" DROP CONSTRAINT "AssetsKitsItems_kit_id_fkey";

-- AlterTable
ALTER TABLE "public"."Assets" DROP COLUMN "costs",
DROP COLUMN "location_name";

-- AlterTable
ALTER TABLE "public"."AssetsKits" DROP COLUMN "name",
DROP COLUMN "stock",
ADD COLUMN     "template_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."Session" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "public"."AssetsKitsItems";

-- CreateTable
CREATE TABLE "public"."KitTemplates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'READY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KitTemplates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KitTemplateItems" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,

    CONSTRAINT "KitTemplateItems_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AssetsKits" ADD CONSTRAINT "AssetsKits_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."KitTemplates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KitTemplateItems" ADD CONSTRAINT "KitTemplateItems_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."KitTemplates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KitTemplateItems" ADD CONSTRAINT "KitTemplateItems_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
