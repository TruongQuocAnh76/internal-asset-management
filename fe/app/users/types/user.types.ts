export type UserRole = 'Admin' | 'Team Lead' | 'Employee'
export type UserStatus = 'ACTIVE' | 'SUSPENDED'

export type UserSummary = {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  department: string
  status: string
  created_at: string
  user_roles?: Array<{ role?: { name?: string } }>
}

export type CreateUserPayload = {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  department: string
}

export type UpdateUserPayload = {
  role: UserRole
  department: string
  status: UserStatus
}
