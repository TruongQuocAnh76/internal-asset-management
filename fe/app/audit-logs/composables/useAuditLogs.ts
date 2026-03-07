import type {
  AuditLogFilters,
  AuditLookupOption,
  AuditLogListResponse,
} from '../types/audit-log.types'

export const useAuditLogs = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.backendUrl

  const getAuditLogs = async (filters: AuditLogFilters) => {
    const query: Record<string, string> = {
      page: String(filters.page ?? 1),
      limit: String(filters.limit ?? 25),
    }

    if (filters.entity_type) query.entity_type = filters.entity_type
    if (filters.action) query.action = filters.action
    if (filters.actor_id) query.actor_id = filters.actor_id
    if (filters.entity_id) query.entity_id = filters.entity_id

    return $fetch<AuditLogListResponse>('/audit-logs', {
      method: 'GET',
      baseURL,
      credentials: 'include',
      query,
    })
  }

  const searchUsers = async (q: string) => {
    const users = await $fetch<Array<{
      id: string
      username: string
      first_name: string
      last_name: string
    }>>('/users', {
      method: 'GET',
      baseURL,
      credentials: 'include',
      query: { search: q },
    })

    return users.slice(0, 20).map((item) => ({
      id: item.id,
      label: `${item.first_name} ${item.last_name} (${item.username})`,
    }))
  }

  const searchEntities = async (q: string) => {
    const [assetsRes, kitsRes] = await Promise.all([
      $fetch<{
        data: Array<{ id: string; name: string; code: string }>
      }>('/assets', {
        method: 'GET',
        baseURL,
        credentials: 'include',
        query: { search: q, limit: 20 },
      }),
      $fetch<{
        data: Array<{ id: string; template: { name: string } }>
      }>('/kits', {
        method: 'GET',
        baseURL,
        credentials: 'include',
        query: { search: q, limit: 20 },
      }),
    ])

    const assetOptions: AuditLookupOption[] = assetsRes.data.map((asset) => ({
      id: asset.id,
      label: `${asset.name} (${asset.code})`,
    }))

    const kitOptions: AuditLookupOption[] = kitsRes.data.map((kit) => ({
      id: kit.id,
      label: `${kit.template.name} (Kit)`,
    }))

    return [...assetOptions, ...kitOptions]
  }

  return {
    getAuditLogs,
    searchUsers,
    searchEntities,
  }
}
