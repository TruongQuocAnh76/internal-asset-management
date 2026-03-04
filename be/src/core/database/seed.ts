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
  // Users
  adminUserId: randomUUID(),
  teamLeadUserId: randomUUID(),
  employeeUserId: randomUUID(),

  // Roles
  roleAdminId: randomUUID(),
  roleTeamLeadId: randomUUID(),
  roleEmployeeId: randomUUID(),

  // Permissions
  permRequestApproveId: randomUUID(),
  permRequestProvidedId: randomUUID(),
  permAssetCreateId: randomUUID(),
  permAssetMaintenanceId: randomUUID(),
  permPurchaseRequestTlApproveId: randomUUID(),
  permPurchaseRequestBodApproveId: randomUUID(),
  permPurchaseRequestRejectId: randomUUID(),
  permPurchaseRequestReceiveId: randomUUID(),

  // Categories
  categoryLaptopId: randomUUID(),
  categoryMonitorId: randomUUID(),
  categoryKeyboardId: randomUUID(),
  categoryHeadsetId: randomUUID(),
  categoryPrinterId: randomUUID(),
  categoryServerId: randomUUID(),
  categoryNetworkId: randomUUID(),
  categoryMobileId: randomUUID(),

  // Kit
  kitTemplateId: randomUUID(),
  kitId: randomUUID(),

  // Assets — Laptops
  asset1Id: randomUUID(),
  asset2Id: randomUUID(),
  asset3Id: randomUUID(),
  asset4Id: randomUUID(),
  asset5Id: randomUUID(),
  asset6Id: randomUUID(),
  asset7Id: randomUUID(),

  // Assets — Monitors
  asset8Id: randomUUID(),
  asset9Id: randomUUID(),
  asset10Id: randomUUID(),
  asset11Id: randomUUID(),
  asset12Id: randomUUID(),

  // Assets — Keyboards
  asset13Id: randomUUID(),
  asset14Id: randomUUID(),
  asset15Id: randomUUID(),

  // Assets — Headsets
  asset16Id: randomUUID(),
  asset17Id: randomUUID(),
  asset18Id: randomUUID(),

  // Assets — Printers
  asset19Id: randomUUID(),
  asset20Id: randomUUID(),

  // Assets — Servers
  asset21Id: randomUUID(),
  asset22Id: randomUUID(),

  // Assets — Networking
  asset23Id: randomUUID(),
  asset24Id: randomUUID(),

  // Assets — Mobile
  asset25Id: randomUUID(),
  asset26Id: randomUUID(),

  // Misc
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

  // ── Roles ────────────────────────────────────────────────────────
  const adminRole = await prisma.roles.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { id: ids.roleAdminId, name: 'Admin' },
  });

  const teamLeadRole = await prisma.roles.upsert({
    where: { name: 'Team Lead' },
    update: {},
    create: { id: ids.roleTeamLeadId, name: 'Team Lead' },
  });

  const employeeRole = await prisma.roles.upsert({
    where: { name: 'Employee' },
    update: {},
    create: { id: ids.roleEmployeeId, name: 'Employee' },
  });

  // ── Permissions ───────────────────────────────────────────────────
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

  const permissionAssetCreate = await prisma.permissions.upsert({
    where: { name: 'asset:create' },
    update: {},
    create: {
      id: ids.permAssetCreateId,
      name: 'asset:create',
      resource: 'assets',
      action: 'create',
    },
  });

  const permissionAssetMaintenance = await prisma.permissions.upsert({
    where: { name: 'asset:maintenance' },
    update: {},
    create: {
      id: ids.permAssetMaintenanceId,
      name: 'asset:maintenance',
      resource: 'assets_maintenance',
      action: 'maintenance',
    },
  });

  const permissionPurchaseRequestTlApprove = await prisma.permissions.upsert({
    where: { name: 'purchase-requests:tl-approve' },
    update: {},
    create: {
      id: ids.permPurchaseRequestTlApproveId,
      name: 'purchase-requests:tl-approve',
      resource: 'purchase_requests_tl_approve',
      action: 'purchase_request_tl_approve',
    },
  });

  const permissionPurchaseRequestBodApprove = await prisma.permissions.upsert({
    where: { name: 'purchase-requests:bod-approve' },
    update: {},
    create: {
      id: ids.permPurchaseRequestBodApproveId,
      name: 'purchase-requests:bod-approve',
      resource: 'purchase_requests_bod_approve',
      action: 'purchase_request_bod_approve',
    },
  });

  const permissionPurchaseRequestReject = await prisma.permissions.upsert({
    where: { name: 'purchase-requests:reject' },
    update: {},
    create: {
      id: ids.permPurchaseRequestRejectId,
      name: 'purchase-requests:reject',
      resource: 'purchase_requests_reject',
      action: 'purchase_request_reject',
    },
  });

  const permissionPurchaseRequestReceive = await prisma.permissions.upsert({
    where: { name: 'purchase-requests:receive' },
    update: {},
    create: {
      id: ids.permPurchaseRequestReceiveId,
      name: 'purchase-requests:receive',
      resource: 'purchase_requests_receive',
      action: 'purchase_request_receive',
    },
  });

  // ── Users ─────────────────────────────────────────────────────────
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

  // ── User ↔ Role assignments ───────────────────────────────────────
  for (const [user_id, role_id] of [
    [adminUser.id, adminRole.id],
    [teamLeadUser.id, teamLeadRole.id],
    [employeeUser.id, employeeRole.id],
  ] as [string, string][]) {
    await prisma.userRoles.upsert({
      where: { user_id_role_id: { user_id, role_id } },
      update: {},
      create: { user_id, role_id },
    });
  }

  // ── Role ↔ Permission assignments ────────────────────────────────
  const adminPermissions = [
    permissionRequestProvided.id,
    permissionRequestApprove.id,
    permissionAssetCreate.id,
    permissionAssetMaintenance.id,
    permissionPurchaseRequestBodApprove.id,
    permissionPurchaseRequestReject.id,
    permissionPurchaseRequestReceive.id,
  ];
  for (const permission_id of adminPermissions) {
    await prisma.rolePermissions.upsert({
      where: { role_id_permission_id: { role_id: adminRole.id, permission_id } },
      update: {},
      create: { role_id: adminRole.id, permission_id },
    });
  }

  for (const permission_id of [
    permissionRequestApprove.id,
    permissionPurchaseRequestTlApprove.id,
    permissionPurchaseRequestReject.id,
  ]) {
    await prisma.rolePermissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: teamLeadRole.id,
          permission_id,
        },
      },
      update: {},
      create: { role_id: teamLeadRole.id, permission_id },
    });
  }

  // ── Asset Categories ──────────────────────────────────────────────
  const laptopCategory = await prisma.assetsCategories.upsert({
    where: { code: 'LAPTOP' },
    update: {},
    create: {
      id: ids.categoryLaptopId,
      code: 'LAPTOP',
      name: 'Laptops',
      default_life_months: 48,
      default_depreciation_method: 'STRAIGHT_LINE',
    },
  });

  const monitorCategory = await prisma.assetsCategories.upsert({
    where: { code: 'MONITOR' },
    update: {},
    create: {
      id: ids.categoryMonitorId,
      code: 'MONITOR',
      name: 'Monitors',
      default_life_months: 60,
      default_depreciation_method: 'STRAIGHT_LINE',
    },
  });

  const keyboardCategory = await prisma.assetsCategories.upsert({
    where: { code: 'KEYBOARD' },
    update: {},
    create: {
      id: ids.categoryKeyboardId,
      code: 'KEYBOARD',
      name: 'Keyboards & Input Devices',
      default_life_months: 36,
      default_depreciation_method: 'STRAIGHT_LINE',
    },
  });

  const headsetCategory = await prisma.assetsCategories.upsert({
    where: { code: 'HEADSET' },
    update: {},
    create: {
      id: ids.categoryHeadsetId,
      code: 'HEADSET',
      name: 'Audio & Headsets',
      default_life_months: 36,
      default_depreciation_method: 'STRAIGHT_LINE',
    },
  });

  const printerCategory = await prisma.assetsCategories.upsert({
    where: { code: 'PRINTER' },
    update: {},
    create: {
      id: ids.categoryPrinterId,
      code: 'PRINTER',
      name: 'Printers & Scanners',
      default_life_months: 60,
      default_depreciation_method: 'DECLINING_BALANCE',
      decline_balance_rate: 20,
    },
  });

  const serverCategory = await prisma.assetsCategories.upsert({
    where: { code: 'SERVER' },
    update: {},
    create: {
      id: ids.categoryServerId,
      code: 'SERVER',
      name: 'Servers',
      default_life_months: 72,
      default_depreciation_method: 'STRAIGHT_LINE',
    },
  });

  const networkCategory = await prisma.assetsCategories.upsert({
    where: { code: 'NETWORK' },
    update: {},
    create: {
      id: ids.categoryNetworkId,
      code: 'NETWORK',
      name: 'Networking Equipment',
      default_life_months: 60,
      default_depreciation_method: 'STRAIGHT_LINE',
    },
  });

  const mobileCategory = await prisma.assetsCategories.upsert({
    where: { code: 'MOBILE' },
    update: {},
    create: {
      id: ids.categoryMobileId,
      code: 'MOBILE',
      name: 'Mobile Devices',
      default_life_months: 24,
      default_depreciation_method: 'DECLINING_BALANCE',
      decline_balance_rate: 30,
    },
  });

  // ── Kit ───────────────────────────────────────────────────────────
  const kitTemplate = await prisma.kitTemplates.upsert({
    where: { id: ids.kitTemplateId },
    update: {},
    create: {
      id: ids.kitTemplateId,
      name: 'Starter Kit',
      status: AssetStatus.READY,
    },
  });

  const kit = await prisma.assetsKits.upsert({
    where: { id: ids.kitId },
    update: {},
    create: {
      id: ids.kitId,
      template_id: kitTemplate.id,
      status: AssetStatus.READY,
    },
  });

  // ── Assets ────────────────────────────────────────────────────────
  const assetsDefinitions = [
    // Laptops
    { id: ids.asset1Id, code: 'LT-1001', name: 'ThinkPad X1 Carbon', category_id: laptopCategory.id },
    { id: ids.asset2Id, code: 'LT-1002', name: 'MacBook Pro 16"', category_id: laptopCategory.id },
    { id: ids.asset3Id, code: 'LT-1003', name: 'Dell XPS 15', category_id: laptopCategory.id },
    { id: ids.asset4Id, code: 'LT-1004', name: 'HP EliteBook 840', category_id: laptopCategory.id },
    { id: ids.asset5Id, code: 'LT-1005', name: 'Lenovo ThinkPad T14', category_id: laptopCategory.id },
    { id: ids.asset6Id, code: 'LT-1006', name: 'Microsoft Surface Laptop 5', category_id: laptopCategory.id },
    { id: ids.asset7Id, code: 'LT-1007', name: 'ASUS ROG Zephyrus G14', category_id: laptopCategory.id },

    // Monitors
    { id: ids.asset8Id, code: 'MN-2001', name: 'Dell UltraSharp 27" 4K', category_id: monitorCategory.id },
    { id: ids.asset9Id, code: 'MN-2002', name: 'LG UltraWide 34"', category_id: monitorCategory.id },
    { id: ids.asset10Id, code: 'MN-2003', name: 'Samsung Odyssey Curved 32"', category_id: monitorCategory.id },
    { id: ids.asset11Id, code: 'MN-2004', name: 'ASUS ProArt PA279CV', category_id: monitorCategory.id },
    { id: ids.asset12Id, code: 'MN-2005', name: 'BenQ PD2720U 4K', category_id: monitorCategory.id },

    // Keyboards
    { id: ids.asset13Id, code: 'KB-3001', name: 'Logitech MX Keys', category_id: keyboardCategory.id },
    { id: ids.asset14Id, code: 'KB-3002', name: 'Keychron K2 Mechanical', category_id: keyboardCategory.id },
    { id: ids.asset15Id, code: 'KB-3003', name: 'Razer BlackWidow V3', category_id: keyboardCategory.id },

    // Headsets
    { id: ids.asset16Id, code: 'HS-4001', name: 'Jabra Evolve2 75', category_id: headsetCategory.id },
    { id: ids.asset17Id, code: 'HS-4002', name: 'Sony WH-1000XM5', category_id: headsetCategory.id },
    { id: ids.asset18Id, code: 'HS-4003', name: 'Bose 700 Headphones', category_id: headsetCategory.id },

    // Printers
    { id: ids.asset19Id, code: 'PR-5001', name: 'HP LaserJet Pro M404dn', category_id: printerCategory.id },
    { id: ids.asset20Id, code: 'PR-5002', name: 'Canon imageRUNNER 2630i', category_id: printerCategory.id },

    // Servers
    { id: ids.asset21Id, code: 'SV-6001', name: 'Dell PowerEdge R740', category_id: serverCategory.id },
    { id: ids.asset22Id, code: 'SV-6002', name: 'HPE ProLiant DL380 Gen10', category_id: serverCategory.id },

    // Networking
    { id: ids.asset23Id, code: 'NW-7001', name: 'Cisco Catalyst 9200 Switch', category_id: networkCategory.id },
    { id: ids.asset24Id, code: 'NW-7002', name: 'Ubiquiti UniFi AP Pro', category_id: networkCategory.id },

    // Mobile
    { id: ids.asset25Id, code: 'MB-8001', name: 'iPhone 15 Pro', category_id: mobileCategory.id },
    { id: ids.asset26Id, code: 'MB-8002', name: 'Samsung Galaxy S24 Ultra', category_id: mobileCategory.id },
  ];

  // Capture actual IDs returned by upsert (on re-runs the existing row ID is returned)
  const upsertedAssets = new Map<string, string>();
  for (const def of assetsDefinitions) {
    const result = await prisma.assets.upsert({
      where: { code: def.code },
      update: {},
      create: {
        id: def.id,
        code: def.code,
        name: def.name,
        category_id: def.category_id,
        image_urls: [],
        acquired_at: new Date(),
      },
    });
    upsertedAssets.set(def.code, result.id);
  }
  const aid = (code: string) => upsertedAssets.get(code)!;

  // ── Asset Items ───────────────────────────────────────────────────
  // Delete and recreate to stay idempotent
  await prisma.assetItems.deleteMany({
    where: { asset_id: { in: [...upsertedAssets.values()] } },
  });

  const assetItemsData: {
    asset_id: string;
    status: AssetStatus;
    location_name: string;
    costs: bigint;
    kit_id?: string;
    kit_status?: boolean;
    maintenance_notes?: string;
  }[] = [
    // ── Laptops ──
    { asset_id: aid('LT-1001'), status: AssetStatus.IN_USE,       location_name: 'Office A - Floor 3',       costs: BigInt(150000) },
    { asset_id: aid('LT-1002'), status: AssetStatus.READY,        location_name: 'Office B - Floor 2',       costs: BigInt(250000) },
    { asset_id: aid('LT-1003'), status: AssetStatus.IN_USE,       location_name: 'Office A - Floor 5',       costs: BigInt(180000) },
    { asset_id: aid('LT-1004'), status: AssetStatus.MAINTAINANCE, location_name: 'IT Repair Lab',            costs: BigInt(140000), maintenance_notes: 'Fan replacement and thermal paste reapplication' },
    { asset_id: aid('LT-1005'), status: AssetStatus.READY,        location_name: 'Office C - Floor 1',       costs: BigInt(135000) },
    { asset_id: aid('LT-1006'), status: AssetStatus.READY,        location_name: 'Warehouse - Storage C',    costs: BigInt(165000) },
    { asset_id: aid('LT-1007'), status: AssetStatus.IN_USE,       location_name: 'Office B - Floor 4',       costs: BigInt(220000) },

    // ── Monitors ──
    { asset_id: aid('MN-2001'), status: AssetStatus.READY,        location_name: 'Warehouse - Storage B',    costs: BigInt(65000), kit_id: kit.id, kit_status: true },
    { asset_id: aid('MN-2002'), status: AssetStatus.IN_USE,       location_name: 'Office B - Floor 3',       costs: BigInt(85000) },
    { asset_id: aid('MN-2003'), status: AssetStatus.READY,        location_name: 'Warehouse - Storage A',    costs: BigInt(55000) },
    { asset_id: aid('MN-2004'), status: AssetStatus.IN_USE,       location_name: 'Office A - Floor 4',       costs: BigInt(95000) },
    { asset_id: aid('MN-2005'), status: AssetStatus.BROKEN,       location_name: 'IT Repair Lab',            costs: BigInt(72000) },

    // ── Keyboards ──
    { asset_id: aid('KB-3001'), status: AssetStatus.READY,        location_name: 'Office A - Supplies',      costs: BigInt(12000) },
    { asset_id: aid('KB-3002'), status: AssetStatus.IN_USE,       location_name: 'Office B - Floor 2',       costs: BigInt(9500) },
    { asset_id: aid('KB-3003'), status: AssetStatus.MAINTAINANCE, location_name: 'IT Repair Lab',            costs: BigInt(8000), maintenance_notes: 'Several keycaps broken, replacement ordered' },

    // ── Headsets ──
    { asset_id: aid('HS-4001'), status: AssetStatus.IN_USE,       location_name: 'Office A - Floor 2',       costs: BigInt(35000) },
    { asset_id: aid('HS-4002'), status: AssetStatus.READY,        location_name: 'Warehouse - Storage A',    costs: BigInt(38000) },
    { asset_id: aid('HS-4003'), status: AssetStatus.READY,        location_name: 'Warehouse - Storage B',    costs: BigInt(42000) },

    // ── Printers ──
    { asset_id: aid('PR-5001'), status: AssetStatus.IN_USE,       location_name: 'Office A - Floor 1',       costs: BigInt(45000) },
    { asset_id: aid('PR-5002'), status: AssetStatus.MAINTAINANCE, location_name: 'IT Repair Lab',            costs: BigInt(120000), maintenance_notes: 'Paper feed mechanism jammed, awaiting parts' },

    // ── Servers ──
    { asset_id: aid('SV-6001'), status: AssetStatus.IN_USE,       location_name: 'Data Center - Rack A1',    costs: BigInt(850000) },
    { asset_id: aid('SV-6002'), status: AssetStatus.READY,        location_name: 'Data Center - Rack A2',    costs: BigInt(720000) },

    // ── Networking ──
    { asset_id: aid('NW-7001'), status: AssetStatus.IN_USE,       location_name: 'Data Center - Rack B1',    costs: BigInt(180000) },
    { asset_id: aid('NW-7002'), status: AssetStatus.IN_USE,       location_name: 'Office A - Ceiling',       costs: BigInt(25000) },

    // ── Mobile ──
    { asset_id: aid('MB-8001'), status: AssetStatus.IN_USE,       location_name: 'Operations Dept',          costs: BigInt(55000) },
    { asset_id: aid('MB-8002'), status: AssetStatus.READY,        location_name: 'Warehouse - Storage A',    costs: BigInt(65000) },
  ];

  for (const item of assetItemsData) {
    await prisma.assetItems.create({
      data: {
        asset_id: item.asset_id,
        status: item.status,
        location_name: item.location_name,
        costs: item.costs,
        kit_id: item.kit_id ?? null,
        kit_status: item.kit_status ?? false,
        maintenance_notes: item.maintenance_notes ?? null,
        last_maintained_at: item.maintenance_notes ? new Date() : null,
      },
    });
  }

  // ── Recompute asset statuses to match items ───────────────────────
  const priority: AssetStatus[] = [
    AssetStatus.LIQUIDATED,
    AssetStatus.BROKEN,
    AssetStatus.MAINTAINANCE,
    AssetStatus.IN_USE,
    AssetStatus.READY,
  ];

  for (const actualId of upsertedAssets.values()) {
    const items = await prisma.assetItems.findMany({
      where: { asset_id: actualId },
      select: { status: true },
    });
    if (items.length === 0) continue;
    const dominantStatus = priority.find((s) => items.some((i) => i.status === s)) ?? AssetStatus.READY;
    await prisma.assets.update({
      where: { id: actualId },
      data: { status: dominantStatus },
    });
  }

  // ── Specs for select assets ───────────────────────────────────────
  await prisma.assetsSpecs.upsert({
    where: { asset_id: aid('LT-1001') },
    update: {},
    create: {
      asset_id: aid('LT-1001'),
      specs: { cpu: 'Intel i7-1260P', ram_gb: 32, storage_gb: 512, os: 'Windows 11 Pro' },
    },
  });

  // AssetItems with kit_id are already linked via the kit_id field in assetItemsData
  // No need for separate AssetsKitsItems table (it's commented out in schema)

  await prisma.assetsSpecs.upsert({
    where: { asset_id: aid('LT-1002') },
    update: {},
    create: {
      asset_id: aid('LT-1002'),
      specs: { cpu: 'Apple M3 Pro', ram_gb: 36, storage_gb: 1024, os: 'macOS Sonoma' },
    },
  });

  await prisma.assetsSpecs.upsert({
    where: { asset_id: aid('SV-6001') },
    update: {},
    create: {
      asset_id: aid('SV-6001'),
      specs: { cpu: '2x Intel Xeon Silver 4214', ram_gb: 128, storage_tb: 4, os: 'Windows Server 2022' },
    },
  });

  // ── Allocations, events, requests, audit ─────────────────────────
  const allocationOne = await prisma.assetsAllocation.upsert({
    where: { asset_id: aid('LT-1001') },
    update: {},
    create: {
      id: ids.allocation1Id,
      asset_id: aid('LT-1001'),
      user_id: employeeUser.id,
      allocated_by: adminUser.id,
      allocated_at: new Date(),
    },
  });

  await prisma.assetsAllocation.upsert({
    where: { asset_id: aid('MN-2001') },
    update: {},
    create: {
      id: ids.allocation2Id,
      asset_id: aid('MN-2001'),
      kit_id: kit.id,
      allocated_by: adminUser.id,
      allocated_at: new Date(),
    },
  });

  await prisma.assetsEvents.deleteMany({
    where: { asset_id: aid('LT-1001'), event_type: 'ALLOCATED' },
  });

  await prisma.assetsEvents.create({
    data: {
      id: ids.event1Id,
      asset_id: aid('LT-1001'),
      event_type: 'ALLOCATED',
      actor_id: adminUser.id,
      allocation_id: allocationOne.id,
      previous_status: AssetStatus.READY,
      new_status: AssetStatus.IN_USE,
      payload: { note: 'Allocated to Operations manager' },
    },
  });

  await prisma.borrowRequests.deleteMany({
    where: {
      requester_id: employeeUser.id,
      asset_id: aid('MN-2001'),
    },
  });

  await prisma.borrowRequests.create({
    data: {
      id: ids.borrow1Id,
      asset_id: aid('MN-2001'),
      requester_id: employeeUser.id,
      status: BorrowStatus.PENDING,
      priority: BorrowPriority.MEDIUM,
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  await prisma.auditLogs.deleteMany({ where: { id: ids.audit1Id } });

  await prisma.auditLogs.create({
    data: {
      id: ids.audit1Id,
      actor_id: adminUser.id,
      action: 'asset.created',
      entity_type: Entity.ASSET,
      entity_id: aid('LT-1001'),
      before: {},
      after: { asset: 'LT-1001' },
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
