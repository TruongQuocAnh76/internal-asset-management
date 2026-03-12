/*
  Warnings:

  - The `status` column on the `AssetItems` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `resolved_status` column on the `AssetRepairs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Assets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `AssetsKits` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `KitTemplates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `previous_status` on the `AssetsEvents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `new_status` on the `AssetsEvents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."ItemStatus" AS ENUM ('READY', 'IN_USE', 'MAINTAINANCE', 'BROKEN', 'LIQUIDATED');

-- CreateEnum
CREATE TYPE "public"."TemplateStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "public"."AssetItems" DROP COLUMN "status",
ADD COLUMN     "status" "public"."ItemStatus" NOT NULL DEFAULT 'READY';

-- AlterTable
ALTER TABLE "public"."AssetRepairs" DROP COLUMN "resolved_status",
ADD COLUMN     "resolved_status" "public"."ItemStatus" NOT NULL DEFAULT 'READY';

-- AlterTable
ALTER TABLE "public"."Assets" DROP COLUMN "status",
ADD COLUMN     "status" "public"."TemplateStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "public"."AssetsEvents" DROP COLUMN "previous_status",
ADD COLUMN     "previous_status" "public"."ItemStatus" NOT NULL,
DROP COLUMN "new_status",
ADD COLUMN     "new_status" "public"."ItemStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."AssetsKits" DROP COLUMN "status",
ADD COLUMN     "status" "public"."TemplateStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "public"."KitTemplates" DROP COLUMN "status",
ADD COLUMN     "status" "public"."TemplateStatus" NOT NULL DEFAULT 'AVAILABLE';

CREATE OR REPLACE FUNCTION public.check_borrow_target_ready()
RETURNS trigger AS $$
DECLARE
  v_status public."TemplateStatus";
BEGIN

  IF NEW.asset_id IS NOT NULL THEN
    SELECT status INTO v_status
    FROM public."Assets"
    WHERE id = NEW.asset_id
    FOR SHARE;

    IF v_status IS NULL THEN
      RAISE EXCEPTION 'asset_not_found: asset % does not exist', NEW.asset_id;
    END IF;

    IF v_status != 'AVAILABLE' THEN
      RAISE EXCEPTION 'asset_not_ready: asset % has status %', NEW.asset_id, v_status;
    END IF;
  END IF;

  IF NEW.kit_id IS NOT NULL THEN
    SELECT status INTO v_status
    FROM public."AssetsKits"
    WHERE id = NEW.kit_id
    FOR SHARE;

    IF v_status IS NULL THEN
      RAISE EXCEPTION 'kit_not_found: kit % does not exist', NEW.kit_id;
    END IF;

    IF v_status != 'AVAILABLE' THEN
      RAISE EXCEPTION 'kit_not_ready: kit % has status %', NEW.kit_id, v_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DropEnum
DROP TYPE "public"."AssetStatus";
