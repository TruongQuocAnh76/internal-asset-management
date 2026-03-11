import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserSummary,
} from '../types/user.types'

export const useUsers = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.backendUrl

  const getUsers = async (search?: string) => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    return $fetch<UserSummary[]>('/users', {
      method: 'GET',
      baseURL,
      credentials: 'include',
      params,
    })
  }

  const updateUser = async (
    id: string,
    payload: UpdateUserPayload,
  ) => {
    return $fetch<UserSummary>(`/users/${id}`, {
      method: 'PATCH',
      baseURL,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
  }

  const createUser = async (payload: CreateUserPayload) => {
    return $fetch('/auth/signup', {
      method: 'POST',
      baseURL,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
  }

  return {
    getUsers,
    updateUser,
    createUser,
  }
}
