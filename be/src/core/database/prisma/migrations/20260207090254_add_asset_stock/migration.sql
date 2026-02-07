-- AlterTable
ALTER TABLE "public"."Assets" ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."AssetsKits" ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 1;
