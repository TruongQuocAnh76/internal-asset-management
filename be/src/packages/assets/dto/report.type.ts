export interface SummaryData {
  totalAssetModels: number;
  totalPhysicalUnits: number;
  totalKits: number;
  totalValue: number;
  totalRepairCost: number;
  itemsByStatus: Record<string, number>;
  assetsByStatus: Record<string, number>;
  kitsByStatus: Record<string, number>;
}

export interface InventoryRow {
  assetCode: string;
  assetName: string;
  category: string;
  itemId: string;
  status: string;
  location: string;
  inKit: boolean;
  kitId: string | null;
  cost: number;
  acquiredAt: Date;
  lastMaintained: Date | null;
  allocatedTo: string | null;
  depreciationMethod: string | null;
}

export interface FinancialRow {
  assetCode: string;
  assetName: string;
  itemId: string;
  originalCost: number;
  salvageValue: number;
  lifeMonths: number | null;
  depreciationMethod: string | null;
  declineBalanceRate: number | null;
  accumulatedDepreciation: number;
  currentBookValue: number;
  totalRepairCost: number;
  netAssetValue: number;
}

export interface AllocationRow {
  assetCode: string;
  assetName: string;
  itemId: string;
  status: string;
  allocatedToUser: string | null;
  department: string | null;
  allocatedAt: Date | null;
  borrowDueDate: Date | null;
  overdue: boolean;
}

export interface RepairRow {
  assetCode: string;
  assetName: string;
  itemId: string;
  repairCount: number;
  totalRepairCost: number;
  lastRepairDate: Date | null;
  lastResolvedStatus: string | null;
  maintenanceNotes: string | null;
}

export interface KitRow {
  kitId: string;
  templateName: string;
  kitStatus: string;
  itemCount: number;
  items: string;
  allocatedTo: string | null;
  statusConsistency: string;
}

export interface AuditRow {
  timestamp: Date;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  before: string;
  after: string;
}
