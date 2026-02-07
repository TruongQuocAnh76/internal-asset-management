import {
  PrismaClient,
  AssetStatus,
  BorrowStatus,
  BorrowPriority,
  DeploymentStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { Entity } from '../enums/entity.enum';

const prisma = new PrismaClient();

const ids = {
  adminUserId: randomUUID(),
  teamLeadUserId: randomUUID(),
  employeeUserId: randomUUID(),
  roleAdminId: randomUUID(),
  roleTeamLeadId: randomUUID(),
  roleEmployeeId: randomUUID(),
  permRequestApproveId: randomUUID(),
  permRequestProvidedId: randomUUID(),
  categoryLaptopId: randomUUID(),
  categoryMonitorId: randomUUID(),
  kitId: randomUUID(),
  asset1Id: randomUUID(),
  asset2Id: randomUUID(),
  asset3Id: randomUUID(),
  asset4Id: randomUUID(),
  asset5Id: randomUUID(),
  asset6Id: randomUUID(),
  asset7Id: randomUUID(),
  asset8Id: randomUUID(),
  asset9Id: randomUUID(),
  asset10Id: randomUUID(),
  asset11Id: randomUUID(),
  asset12Id: randomUUID(),
  allocation1Id: randomUUID(),
  allocation2Id: randomUUID(),
  event1Id: randomUUID(),
  borrow1Id: randomUUID(),
  audit1Id: randomUUID(),
};

async function main() {
  const [adminPassword, teamLeadPassword, employeePassword] = await Promise.all(
    [
      bcrypt.hash('Admin123!', 10),
      bcrypt.hash('TeamLead123!', 10),
      bcrypt.hash('Employee123!', 10),
    ],
  );

  const adminRole = await prisma.roles.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      id: ids.roleAdminId,
      name: 'Admin',
    },
  });

  const teamLeadRole = await prisma.roles.upsert({
    where: { name: 'Team Lead' },
    update: {},
    create: {
      id: ids.roleTeamLeadId,
      name: 'Team Lead',
    },
  });

  const employeeRole = await prisma.roles.upsert({
    where: { name: 'Employee' },
    update: {},
    create: {
      id: ids.roleEmployeeId,
      name: 'Employee',
    },
  });

  const permissionRequestApprove = await prisma.permissions.upsert({
    where: { name: 'request:approve' },
    update: {},
    create: {
      id: ids.permRequestApproveId,
      name: 'request:approve',
      resource: 'requests_approve',
      action: 'approve',
    },
  });

  const permissionRequestProvided = await prisma.permissions.upsert({
    where: { name: 'request:provided' },
    update: {},
    create: {
      id: ids.permRequestProvidedId,
      name: 'request:provided',
      resource: 'requests_provided',
      action: 'provided',
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

  const teamLeadUser = await prisma.users.upsert({
    where: { email: 'teamlead@asset.local' },
    update: {},
    create: {
      id: ids.teamLeadUserId,
      username: 'teamlead',
      email: 'teamlead@asset.local',
      password: teamLeadPassword,
      first_name: 'Team',
      last_name: 'Lead',
      department: 'Operations',
      status: DeploymentStatus.ACTIVE,
    },
  });

  const employeeUser = await prisma.users.upsert({
    where: { email: 'employee@asset.local' },
    update: {},
    create: {
      id: ids.employeeUserId,
      username: 'employee',
      email: 'employee@asset.local',
      password: employeePassword,
      first_name: 'John',
      last_name: 'Employee',
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
        user_id: teamLeadUser.id,
        role_id: teamLeadRole.id,
      },
    },
    update: {},
    create: {
      user_id: teamLeadUser.id,
      role_id: teamLeadRole.id,
    },
  });

  await prisma.userRoles.upsert({
    where: {
      user_id_role_id: {
        user_id: employeeUser.id,
        role_id: employeeRole.id,
      },
    },
    update: {},
    create: {
      user_id: employeeUser.id,
      role_id: employeeRole.id,
    },
  });

  await prisma.rolePermissions.upsert({
    where: {
      role_id_permission_id: {
        role_id: adminRole.id,
        permission_id: permissionRequestProvided.id,
      },
    },
    update: {},
    create: {
      role_id: adminRole.id,
      permission_id: permissionRequestProvided.id,
    },
  });

  await prisma.rolePermissions.upsert({
    where: {
      role_id_permission_id: {
        role_id: adminRole.id,
        permission_id: permissionRequestApprove.id,
      },
    },
    update: {},
    create: {
      role_id: adminRole.id,
      permission_id: permissionRequestApprove.id,
    },
  });

  await prisma.rolePermissions.upsert({
    where: {
      role_id_permission_id: {
        role_id: teamLeadRole.id,
        permission_id: permissionRequestApprove.id,
      },
    },
    update: {},
    create: {
      role_id: teamLeadRole.id,
      permission_id: permissionRequestApprove.id,
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
      stock: 5,
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
      location_name: 'Office Building A - Floor 3',
      costs: BigInt(150000),
      stock: 1,
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
      location_name: 'Warehouse - Storage Room B',
      costs: BigInt(65000),
      stock: 1,
      kit_id: kit.id,
      kit_status: true,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'LT-1002' },
    update: {},
    create: {
      id: ids.asset3Id,
      code: 'LT-1002',
      name: 'MacBook Pro 16',
      category_id: laptopCategory.id,
      status: AssetStatus.READY,
      location_name: 'Office Building B - Floor 2',
      costs: BigInt(250000),
      stock: 1,
      kit_id: null,
      kit_status: false,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'LT-1003' },
    update: {},
    create: {
      id: ids.asset4Id,
      code: 'LT-1003',
      name: 'Dell XPS 15',
      category_id: laptopCategory.id,
      status: AssetStatus.IN_USE,
      location_name: 'Office Building A - Floor 5',
      costs: BigInt(180000),
      stock: 1,
      kit_id: null,
      kit_status: false,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'MN-2002' },
    update: {},
    create: {
      id: ids.asset5Id,
      code: 'MN-2002',
      name: 'LG UltraWide 34',
      category_id: monitorCategory.id,
      status: AssetStatus.IN_USE,
      location_name: 'Office Building B - Floor 3',
      costs: BigInt(85000),
      stock: 1,
      kit_id: null,
      kit_status: false,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'MN-2003' },
    update: {},
    create: {
      id: ids.asset6Id,
      code: 'MN-2003',
      name: 'Samsung Curved 32',
      category_id: monitorCategory.id,
      status: AssetStatus.READY,
      location_name: 'Warehouse - Storage Room A',
      costs: BigInt(55000),
      stock: 1,
      kit_id: null,
      kit_status: false,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'LT-1004' },
    update: {},
    create: {
      id: ids.asset7Id,
      code: 'LT-1004',
      name: 'HP EliteBook 840',
      category_id: laptopCategory.id,
      status: AssetStatus.MAINTAINANCE,
      location_name: 'IT Department - Repair Lab',
      costs: BigInt(140000),
      stock: 1,
      kit_id: null,
      kit_status: false,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'LT-1005' },
    update: {},
    create: {
      id: ids.asset8Id,
      code: 'LT-1005',
      name: 'Lenovo ThinkPad T14',
      category_id: laptopCategory.id,
      status: AssetStatus.READY,
      location_name: 'Office Building C - Floor 1',
      costs: BigInt(135000),
      stock: 1,
      kit_id: null,
      kit_status: false,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'MN-2004' },
    update: {},
    create: {
      id: ids.asset9Id,
      code: 'MN-2004',
      name: 'ASUS ProArt 27',
      category_id: monitorCategory.id,
      status: AssetStatus.IN_USE,
      location_name: 'Office Building A - Floor 4',
      costs: BigInt(95000),
      stock: 1,
      kit_id: null,
      kit_status: false,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'LT-1006' },
    update: {},
    create: {
      id: ids.asset10Id,
      code: 'LT-1006',
      name: 'Microsoft Surface Laptop 5',
      category_id: laptopCategory.id,
      status: AssetStatus.READY,
      location_name: 'Warehouse - Storage Room C',
      costs: BigInt(165000),
      stock: 1,
      kit_id: null,
      kit_status: false,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'MN-2005' },
    update: {},
    create: {
      id: ids.asset11Id,
      code: 'MN-2005',
      name: 'BenQ PD2720U 4K',
      category_id: monitorCategory.id,
      status: AssetStatus.BROKEN,
      location_name: 'IT Department - Repair Lab',
      costs: BigInt(72000),
      stock: 1,
      kit_id: null,
      kit_status: false,
    },
  });

  await prisma.assets.upsert({
    where: { code: 'LT-1007' },
    update: {},
    create: {
      id: ids.asset12Id,
      code: 'LT-1007',
      name: 'ASUS ROG Zephyrus',
      category_id: laptopCategory.id,
      status: AssetStatus.IN_USE,
      location_name: 'Office Building B - Floor 4',
      costs: BigInt(220000),
      stock: 1,
      kit_id: null,
      kit_status: false,
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
      user_id: employeeUser.id,
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
      requester_id: employeeUser.id,
      status: BorrowStatus.PENDING,
      priority: BorrowPriority.MEDIUM,
    },
  });

  await prisma.auditLogs.deleteMany({
    where: { id: ids.audit1Id },
  });

  await prisma.auditLogs.create({
    data: {
      id: ids.audit1Id,
      actor_id: adminUser.id,
      action: 'asset.created',
      entity_type: Entity.ASSET,
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
