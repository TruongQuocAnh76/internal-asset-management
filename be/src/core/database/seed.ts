import {
  PrismaClient,
  AssetStatus,
  BorrowStatus,
  DeploymentStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ids = {
  adminUserId: '11111111-1111-1111-1111-111111111111',
  managerUserId: '22222222-2222-2222-2222-222222222222',
  roleAdminId: '33333333-3333-3333-3333-333333333333',
  roleManagerId: '44444444-4444-4444-4444-444444444444',
  permAssetsReadId: '55555555-5555-5555-5555-555555555555',
  permAssetsWriteId: '66666666-6666-6666-6666-666666666666',
  permUsersManageId: '77777777-7777-7777-7777-777777777777',
  categoryLaptopId: '88888888-8888-8888-8888-888888888888',
  categoryMonitorId: '99999999-9999-9999-9999-999999999999',
  kitId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  asset1Id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  asset2Id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  allocation1Id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  allocation2Id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  event1Id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  borrow1Id: '12121212-1212-1212-1212-121212121212',
  audit1Id: '13131313-1313-1313-1313-131313131313',
};

async function main() {
  const [adminPassword, managerPassword] = await Promise.all([
    bcrypt.hash('Admin123!', 10),
    bcrypt.hash('Manager123!', 10),
  ]);

  const adminRole = await prisma.roles.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      id: ids.roleAdminId,
      name: 'Admin',
    },
  });

  const managerRole = await prisma.roles.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      id: ids.roleManagerId,
      name: 'Manager',
    },
  });

  const permissionAssetsRead = await prisma.permissions.upsert({
    where: { name: 'assets:read' },
    update: {},
    create: {
      id: ids.permAssetsReadId,
      name: 'assets:read',
      resource: 'assets_read',
      action: 'read_assets',
    },
  });

  const permissionAssetsWrite = await prisma.permissions.upsert({
    where: { name: 'assets:write' },
    update: {},
    create: {
      id: ids.permAssetsWriteId,
      name: 'assets:write',
      resource: 'assets_write',
      action: 'write_assets',
    },
  });

  const permissionUsersManage = await prisma.permissions.upsert({
    where: { name: 'users:manage' },
    update: {},
    create: {
      id: ids.permUsersManageId,
      name: 'users:manage',
      resource: 'users_manage',
      action: 'manage_users',
    },
  });

  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@asset.local' },
    update: {},
    create: {
      id: ids.adminUserId,
      username: 'admin',
      email: 'admin@asset.local',
      password: adminPassword,
      first_name: 'System',
      last_name: 'Admin',
      department: 'IT',
      status: DeploymentStatus.ACTIVE,
    },
  });

  const managerUser = await prisma.users.upsert({
    where: { email: 'manager@asset.local' },
    update: {},
    create: {
      id: ids.managerUserId,
      username: 'manager',
      email: 'manager@asset.local',
      password: managerPassword,
      first_name: 'Operations',
      last_name: 'Manager',
      department: 'Operations',
      status: DeploymentStatus.ACTIVE,
    },
  });

  await prisma.userRoles.upsert({
    where: {
      user_id_role_id: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    },
    update: {},
    create: {
      user_id: adminUser.id,
      role_id: adminRole.id,
    },
  });

  await prisma.userRoles.upsert({
    where: {
      user_id_role_id: {
        user_id: managerUser.id,
        role_id: managerRole.id,
      },
    },
    update: {},
    create: {
      user_id: managerUser.id,
      role_id: managerRole.id,
    },
  });

  await prisma.rolePermissions.upsert({
    where: {
      role_id_permission_id: {
        role_id: adminRole.id,
        permission_id: permissionAssetsRead.id,
      },
    },
    update: {},
    create: {
      role_id: adminRole.id,
      permission_id: permissionAssetsRead.id,
    },
  });

  await prisma.rolePermissions.upsert({
    where: {
      role_id_permission_id: {
        role_id: adminRole.id,
        permission_id: permissionAssetsWrite.id,
      },
    },
    update: {},
    create: {
      role_id: adminRole.id,
      permission_id: permissionAssetsWrite.id,
    },
  });

  await prisma.rolePermissions.upsert({
    where: {
      role_id_permission_id: {
        role_id: adminRole.id,
        permission_id: permissionUsersManage.id,
      },
    },
    update: {},
    create: {
      role_id: adminRole.id,
      permission_id: permissionUsersManage.id,
    },
  });

  await prisma.rolePermissions.upsert({
    where: {
      role_id_permission_id: {
        role_id: managerRole.id,
        permission_id: permissionAssetsRead.id,
      },
    },
    update: {},
    create: {
      role_id: managerRole.id,
      permission_id: permissionAssetsRead.id,
    },
  });

  const laptopCategory = await prisma.assetsCategories.upsert({
    where: { code: 'LAPTOP' },
    update: {},
    create: {
      id: ids.categoryLaptopId,
      code: 'LAPTOP',
      name: 'Laptops',
    },
  });

  const monitorCategory = await prisma.assetsCategories.upsert({
    where: { code: 'MONITOR' },
    update: {},
    create: {
      id: ids.categoryMonitorId,
      code: 'MONITOR',
      name: 'Monitors',
    },
  });

  const kit = await prisma.assetsKits.upsert({
    where: { id: ids.kitId },
    update: {},
    create: {
      id: ids.kitId,
      name: 'Starter Kit',
      status: AssetStatus.READY,
    },
  });

  const assetOne = await prisma.assets.upsert({
    where: { code: 'LT-1001' },
    update: {},
    create: {
      id: ids.asset1Id,
      code: 'LT-1001',
      name: 'ThinkPad X1',
      category_id: laptopCategory.id,
      status: AssetStatus.IN_USE,
      location_id: randomUUID(),
      costs: BigInt(150000),
      kit_id: null,
      kit_status: false,
    },
  });

  const assetTwo = await prisma.assets.upsert({
    where: { code: 'MN-2001' },
    update: {},
    create: {
      id: ids.asset2Id,
      code: 'MN-2001',
      name: 'Dell UltraSharp 27',
      category_id: monitorCategory.id,
      status: AssetStatus.READY,
      location_id: randomUUID(),
      costs: BigInt(65000),
      kit_id: kit.id,
      kit_status: true,
    },
  });

  await prisma.assetsSpecs.upsert({
    where: { asset_id: assetOne.id },
    update: {},
    create: {
      asset_id: assetOne.id,
      specs: {
        cpu: 'Intel i7',
        ram_gb: 32,
        storage_gb: 512,
        os: 'Windows 11 Pro',
      },
    },
  });

  const allocationOne = await prisma.assetsAllocation.upsert({
    where: { id: ids.allocation1Id },
    update: {},
    create: {
      id: ids.allocation1Id,
      asset_id: assetOne.id,
      user_id: managerUser.id,
      allocated_by: adminUser.id,
      allocated_at: new Date(),
    },
  });

  const allocationTwo = await prisma.assetsAllocation.upsert({
    where: { id: ids.allocation2Id },
    update: {},
    create: {
      id: ids.allocation2Id,
      asset_id: assetTwo.id,
      kit_id: kit.id,
      allocated_by: adminUser.id,
      allocated_at: new Date(),
    },
  });

  await prisma.assetsEvents.upsert({
    where: { id: ids.event1Id },
    update: {},
    create: {
      id: ids.event1Id,
      asset_id: assetOne.id,
      event_type: 'ALLOCATED',
      actor_id: adminUser.id,
      allocation_id: allocationOne.id,
      previous_status: AssetStatus.READY,
      new_status: AssetStatus.IN_USE,
      payload: {
        note: 'Allocated to Operations manager',
      },
    },
  });

  await prisma.borrowRequests.upsert({
    where: { id: ids.borrow1Id },
    update: {},
    create: {
      id: ids.borrow1Id,
      asset_id: assetTwo.id,
      requester_id: managerUser.id,
      status: BorrowStatus.PENDING,
    },
  });

  await prisma.auditLogs.upsert({
    where: { id: ids.audit1Id },
    update: {},
    create: {
      id: ids.audit1Id,
      actor_id: adminUser.id,
      action: 'asset.created',
      entity_type: 'Assets',
      entity_id: assetOne.id,
      before: {},
      after: {
        asset: assetOne.code,
        status: assetOne.status,
      },
    },
  });

  await prisma.session.upsert({
    where: { sid: 'seed-admin-session' },
    update: {},
    create: {
      id: 'seed-admin-session',
      sid: 'seed-admin-session',
      data: JSON.stringify({ userId: adminUser.id, role: adminRole.name }),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
