-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('READY', 'IN_USE', 'MAINTAINANCE', 'BROKEN', 'ON_SALE');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Assets" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'READY',
    "location_id" UUID NOT NULL,
    "costs" BIGINT NOT NULL DEFAULT 0,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetsCategories" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AssetsCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetsSpecs" (
    "asset_id" UUID NOT NULL,
    "specs" JSONB NOT NULL,

    CONSTRAINT "AssetsSpecs_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "AssetsEvents" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetsEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetsKits" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'READY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetsKits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetsKitItems" (
    "kit_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" "DeploymentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Permissions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assets_code_key" ON "Assets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AssetsCategories_code_key" ON "AssetsCategories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AssetsKitItems_kit_id_asset_id_key" ON "AssetsKitItems"("kit_id", "asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_name_key" ON "Roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoles_user_id_role_id_key" ON "UserRoles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_name_key" ON "Permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_resource_key" ON "Permissions"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_action_key" ON "Permissions"("action");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissions_role_id_permission_id_key" ON "RolePermissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLogs_action_key" ON "AuditLogs"("action");

-- AddForeignKey
ALTER TABLE "AssetsSpecs" ADD CONSTRAINT "AssetsSpecs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetsEvents" ADD CONSTRAINT "AssetsEvents_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetsEvents" ADD CONSTRAINT "AssetsEvents_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetsKitItems" ADD CONSTRAINT "AssetsKitItems_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "AssetsKits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetsKitItems" ADD CONSTRAINT "AssetsKitItems_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogs" ADD CONSTRAINT "AuditLogs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
