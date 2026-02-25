// Request Types for Borrow Flow - Aligned with Backend Schema

export type BorrowStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROVIDED' | 'OVERDUE' | 'CANCELED' | 'RETURNED'

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type RequestType = 'asset' | 'kit'

export type ApprovalAction = 'APPROVE' | 'REJECT'

export type UserRole = 'EMPLOYEE' | 'TEAM_LEAD' | 'ADMIN'

// Timeline event types (for historical UI components)
export type TimelineEventType = 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'ASSIGNED' | 'PROVIDED' | 'RETURNED' | 'CANCELED' | 'COMMENT'

// Timeline entry (for historical UI components)
export interface TimelineEntry {
  id: string
  event_type: TimelineEventType
  created_at: string
  description?: string
  user?: RequestUser
}

// Asset type (legacy/unused)
export interface AssetType {
  id: string
  name: string
  category: string
}

// Asset category
export interface AssetCategory {
  id: string
  code: string
  name: string
}

// Asset from backend
export interface RequestAsset {
  id: string
  code: string
  name: string
  status: string
  location_name: string
  category_id: string
  category?: AssetCategory
}

export interface RequestKit {
  id: string
  status: string
  template: {
    id: string
    name: string
  }
}

// User info
export interface RequestUser {
  id: string
  first_name: string
  last_name: string
  email: string
  username: string
  department: string
}

// Main Borrow Request interface - matches Prisma BorrowRequests
export interface BorrowRequest {
  id: string
  asset_id: string | null
  kit_id: string | null
  requester_id: string
  requested_at: string
  status: BorrowStatus
  reason: string | null
  priority: RequestPriority
  approved_at: string | null
  approved_by: string | null
  provided_at: string | null
  provided_by: string | null
  returned_at: string | null
  due_date: string
  created_at: string
  // Relations (when included)
  asset?: RequestAsset
  kit?: RequestKit
  user?: RequestUser
}

export interface ApprovalStep {
  step_number: number
  role: UserRole
  label: string
  action: string
  status: 'PENDING' | 'COMPLETED' | 'CURRENT' | 'REJECTED'
}

// Form data for creating/editing request
export interface RequestFormData {
  type: RequestType
  assetId?: string
  kitId?: string
  requesterId: string
  reason: string
  priority: RequestPriority
  dueDate: string
}

// Draft data stored in localStorage
export interface RequestDraft {
  id: string
  form_data: RequestFormData
  saved_at: string
  expires_at: string
}

// Query params for fetching requests - matches backend getRequestsDto
export interface GetRequestsParams {
  filter?: 'requesterId' | 'category' | 'costs' | 'status' | 'acquired_at' | 'kitId'
  filterValue?: string
  search?: string
  sort?: string
  page?: number
  limit?: number
  order?: 'asc' | 'desc'
  orderBy?: 'category' | 'status' | 'costs' | 'acquired_at'
}

// Filter options for UI
export interface RequestFilterOptions {
  view: 'my_requests' | 'team_requests' | 'all_requests' | 'pending_approval'
  status?: BorrowStatus
  priority?: RequestPriority
  search?: string
}

// Status config for UI display
export interface StatusConfig {
  label: string
  color: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
  bgClass: string
  textClass: string
  icon: string
}

// Priority config for UI display
export interface PriorityConfig {
  label: string
  color: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
  bgClass: string
  textClass: string
}

// Action permissions based on role and status
export interface RequestPermissions {
  canView: boolean
  canEdit: boolean
  canCancel: boolean
  canApprove: boolean
  canReject: boolean
  canProvide: boolean
  canReturn: boolean
}

// Helper to get approval chain status based on request status
export function getApprovalChain(status: BorrowStatus): ApprovalStep[] {
  const steps: ApprovalStep[] = [
    {
      step_number: 1,
      role: 'EMPLOYEE',
      label: 'Request Submitted',
      action: 'Submit',
      status: 'COMPLETED'
    },
    {
      step_number: 2,
      role: 'TEAM_LEAD',
      label: 'Team Lead Approval',
      action: 'Approve',
      status: 'PENDING'
    },
    {
      step_number: 3,
      role: 'ADMIN',
      label: 'Admin Provides Asset',
      action: 'Provide',
      status: 'PENDING'
    },
    {
      step_number: 4,
      role: 'EMPLOYEE',
      label: 'Asset Returned',
      action: 'Return',
      status: 'PENDING'
    }
  ]

  switch (status) {
    case 'PENDING':
      steps[1]!.status = 'CURRENT'
      break
    case 'APPROVED':
      steps[1]!.status = 'COMPLETED'
      steps[2]!.status = 'CURRENT'
      break
    case 'PROVIDED':
    case 'OVERDUE':
      steps[1]!.status = 'COMPLETED'
      steps[2]!.status = 'COMPLETED'
      steps[3]!.status = 'CURRENT'
      break
    case 'RETURNED':
      steps[1]!.status = 'COMPLETED'
      steps[2]!.status = 'COMPLETED'
      steps[3]!.status = 'COMPLETED'
      break
    case 'REJECTED':
      steps[1]!.status = 'REJECTED'
      break
    case 'CANCELED':
      steps[0]!.status = 'REJECTED'
      break
  }

  return steps
}
