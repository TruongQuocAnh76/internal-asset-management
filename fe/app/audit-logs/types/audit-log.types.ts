export type AuditLog = {
  id: string
  action: string
  entity_type: string
  entity_id: string
  actor_id: string
  created_at: string
  user?: { id: string; username: string; first_name: string; last_name: string }
}

export type AuditLogFilters = {
  entity_type?: string
  action?: string
  actor_id?: string
  entity_id?: string
  page?: number
  limit?: number
}

export type AuditLogListResponse = {
  data: AuditLog[]
  total: number
  totalPages: number
}

export type AuditLookupOption = {
  id: string
  label: string
}
