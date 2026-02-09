-- CreateEnum
CREATE TYPE "public"."AssetStatus" AS ENUM ('READY', 'IN_USE', 'MAINTAINANCE', 'BROKEN', 'LIQUIDATED');

-- CreateEnum
CREATE TYPE "public"."DeploymentStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."BorrowStatus" AS ENUM ('PENDING', 'PROVIDED', 'APPROVED', 'REJECTED', 'OVERDUE', 'CANCELED', 'RETURNED');

-- CreateEnum
CREATE TYPE "public"."BorrowPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."Entity" AS ENUM ('ASSET', 'USER', 'CATEGORY', 'BORROW_REQUEST', 'ASSET_ALLOCATION');

-- CreateTable
CREATE TABLE "public"."Assets" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'READY',
    "location_name" TEXT NOT NULL,
    "costs" BIGINT NOT NULL DEFAULT 0,
    "image_urls" TEXT[],
    "kit_id" UUID,
    "kit_status" BOOLEAN NOT NULL DEFAULT false,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetsCategories" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AssetsCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetsSpecs" (
    "asset_id" UUID NOT NULL,
    "specs" JSONB NOT NULL,

    CONSTRAINT "AssetsSpecs_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "public"."AssetsEvents" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_id" UUID NOT NULL,
    "allocation_id" UUID NOT NULL,
    "occured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous_status" "public"."AssetStatus" NOT NULL,
    "new_status" "public"."AssetStatus" NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetsEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetsKits" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'READY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetsKits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetsAllocation" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "kit_id" UUID,
    "user_id" UUID,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned_at" TIMESTAMP(3),
    "allocated_by" UUID,

    CONSTRAINT "AssetsAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" "public"."DeploymentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRoles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "public"."Permissions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "public"."BorrowRequests" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."BorrowStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "priority" "public"."BorrowPriority" NOT NULL DEFAULT 'LOW',
    "approved_at" TIMESTAMP(3),
    "approved_by" UUID,
    "provided_at" TIMESTAMP(3),
    "provided_by" UUID,
    "returned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BorrowRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLogs" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" "public"."Entity" NOT NULL,
    "entity_id" UUID NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assets_code_key" ON "public"."Assets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AssetsCategories_code_key" ON "public"."AssetsCategories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "public"."Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "public"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_name_key" ON "public"."Roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoles_user_id_role_id_key" ON "public"."UserRoles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_name_key" ON "public"."Permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_resource_key" ON "public"."Permissions"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_action_key" ON "public"."Permissions"("action");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissions_role_id_permission_id_key" ON "public"."RolePermissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLogs_action_key" ON "public"."AuditLogs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "public"."Session"("sid");

-- AddForeignKey
ALTER TABLE "public"."Assets" ADD CONSTRAINT "Assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."AssetsCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetsSpecs" ADD CONSTRAINT "AssetsSpecs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetsEvents" ADD CONSTRAINT "AssetsEvents_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetsEvents" ADD CONSTRAINT "AssetsEvents_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetsAllocation" ADD CONSTRAINT "AssetsAllocation_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetsAllocation" ADD CONSTRAINT "AssetsAllocation_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "public"."AssetsKits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetsAllocation" ADD CONSTRAINT "AssetsAllocation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRoles" ADD CONSTRAINT "UserRoles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRoles" ADD CONSTRAINT "UserRoles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermissions" ADD CONSTRAINT "RolePermissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermissions" ADD CONSTRAINT "RolePermissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."Permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowRequests" ADD CONSTRAINT "BorrowRequests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowRequests" ADD CONSTRAINT "BorrowRequests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLogs" ADD CONSTRAINT "AuditLogs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
