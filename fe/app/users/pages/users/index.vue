<script setup lang="ts">
import { useUsers } from '../../composables/useUsers'

definePageMeta({
  layout: 'default',
})

type UserSummary = {
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

const { user } = useAuth()
const { getUsers, updateUser, createUser } = useUsers()
const users = ref<UserSummary[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const isSaving = ref(false)

// Edit modal state
const showEditModal = ref(false)
const editingUser = ref<UserSummary | null>(null)
const editForm = ref({
  role: 'Employee' as 'Admin' | 'Team Lead' | 'Employee',
  department: '',
  status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
})

// Create user modal state
const showCreateModal = ref(false)
const isCreating = ref(false)
const createError = ref('')
const createSuccess = ref('')
const createForm = ref({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  department: '',
})

const roleOptions: Array<'Admin' | 'Team Lead' | 'Employee'> = ['Admin', 'Team Lead', 'Employee']

const isAdmin = computed(() => {
  const roles = user.value?.user_roles?.map((item: any) => item?.role?.name) || []
  return roles.includes('Admin')
})

const loadUsers = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getUsers()

    users.value = Array.isArray(data) ? data : []
  } catch (error: any) {
    users.value = []
    errorMessage.value = error?.data?.message || 'Failed to load users'
  } finally {
    isLoading.value = false
  }
}

const formatDate = (value: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const getRoles = (userItem: UserSummary) => {
  if (!userItem.user_roles?.length) return '-'
  return userItem.user_roles
    .map(item => item.role?.name)
    .filter(Boolean)
    .join(', ')
}

const getPrimaryRole = (userItem: UserSummary) => {
  const roleName = userItem.user_roles?.[0]?.role?.name
  if (roleName === 'Admin' || roleName === 'Team Lead' || roleName === 'Employee') {
    return roleName
  }
  return 'Employee'
}

// Edit modal
const openEditModal = (userItem: UserSummary) => {
  editingUser.value = userItem
  editForm.value = {
    role: getPrimaryRole(userItem),
    department: userItem.department || '',
    status: userItem.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingUser.value = null
}

const saveEdit = async () => {
  if (!editingUser.value) return

  isSaving.value = true
  errorMessage.value = ''

  try {
    const updatedUser = await updateUser(editingUser.value.id, {
      role: editForm.value.role,
      department: editForm.value.department,
      status: editForm.value.status,
    })

    users.value = users.value.map((item) =>
      item.id === updatedUser.id ? updatedUser : item,
    )
    closeEditModal()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || 'Failed to update user'
  } finally {
    isSaving.value = false
  }
}

// Create user modal
const openCreateModal = () => {
  createForm.value = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  }
  createError.value = ''
  createSuccess.value = ''
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const submitCreateUser = async () => {
  createError.value = ''
  createSuccess.value = ''

  const { firstName, lastName, username, email, password, confirmPassword, department } = createForm.value

  if (!firstName || !lastName || !username || !email || !password || !confirmPassword || !department) {
    createError.value = 'Please fill in all fields'
    return
  }

  if (password !== confirmPassword) {
    createError.value = 'Passwords do not match'
    return
  }

  if (password.length < 6) {
    createError.value = 'Password must be at least 6 characters long'
    return
  }

  isCreating.value = true

  try {
    await createUser({
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      department,
    })

    createSuccess.value = 'User created successfully!'
    await loadUsers()

    setTimeout(() => {
      closeCreateModal()
    }, 1500)
  } catch (error: any) {
    createError.value = error?.data?.error || error?.data?.message || 'Failed to create user'
  } finally {
    isCreating.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-secondary-900">User Management</h1>
          <p class="text-secondary-600 mt-1">Directory of system users.</p>
        </div>
        <button
          v-if="isAdmin"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          @click="openCreateModal"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create User
        </button>
      </div>

      <div class="rounded-xl border border-secondary-200 bg-white shadow-sm overflow-hidden">
        <div v-if="isLoading" class="p-6 text-secondary-600">Loading users...</div>

        <div v-else-if="errorMessage" class="p-6 text-danger-600">
          {{ errorMessage }}
        </div>

        <div v-else-if="users.length === 0" class="p-6 text-secondary-600">
          No users found.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-secondary-200">
            <thead class="bg-secondary-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase text-secondary-600">Name</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase text-secondary-600">Username</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase text-secondary-600">Email</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase text-secondary-600">Department</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase text-secondary-600">Roles</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase text-secondary-600">Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase text-secondary-600">Joined</th>
                <th v-if="isAdmin" class="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase text-secondary-600">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-secondary-100">
              <tr v-for="userItem in users" :key="userItem.id" class="hover:bg-secondary-50">
                <td class="px-4 py-3 text-sm text-secondary-900">
                  {{ userItem.first_name }} {{ userItem.last_name }}
                </td>
                <td class="px-4 py-3 text-sm text-secondary-700">{{ userItem.username }}</td>
                <td class="px-4 py-3 text-sm text-secondary-700">{{ userItem.email }}</td>
                <td class="px-4 py-3 text-sm text-secondary-700">{{ userItem.department }}</td>
                <td class="px-4 py-3 text-sm text-secondary-700">{{ getRoles(userItem) }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                    :class="userItem.status === 'ACTIVE' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'"
                  >
                    {{ userItem.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-secondary-700">{{ formatDate(userItem.created_at) }}</td>
                <td v-if="isAdmin" class="px-4 py-3 text-sm text-secondary-700">
                  <button
                    type="button"
                    class="inline-flex items-center rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                    @click="openEditModal(userItem)"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/50 px-4">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h2 class="text-lg font-bold text-secondary-900">Edit User</h2>
          <p class="mt-1 text-sm text-secondary-600">
            Update role, department, and status for
            <span class="font-semibold">{{ editingUser?.first_name }} {{ editingUser?.last_name }}</span>.
          </p>

          <div class="mt-5 space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-secondary-700">Role</label>
              <select
                v-model="editForm.role"
                class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
              >
                <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-secondary-700">Department</label>
              <input
                v-model="editForm.department"
                type="text"
                class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
                placeholder="Enter department"
              >
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-secondary-700">Status</label>
              <button
                type="button"
                class="inline-flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium"
                :class="editForm.status === 'ACTIVE' ? 'border-success-200 bg-success-50 text-success-700' : 'border-warning-200 bg-warning-50 text-warning-700'"
                @click="editForm.status = editForm.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'"
              >
                <span>{{ editForm.status }}</span>
                <span class="text-xs">Click to toggle</span>
              </button>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100"
              @click="closeEditModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSaving"
              @click="saveEdit"
            >
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create User Modal -->
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/50 px-4 py-8">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl overflow-y-auto max-h-full">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-secondary-900">Create New User</h2>
            <button
              type="button"
              class="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700"
              @click="closeCreateModal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="submitCreateUser">
            <!-- Name Fields Row -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-secondary-700">First Name</label>
                <input
                  v-model="createForm.firstName"
                  type="text"
                  placeholder="John"
                  class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-secondary-700">Last Name</label>
                <input
                  v-model="createForm.lastName"
                  type="text"
                  placeholder="Doe"
                  class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <!-- Username -->
            <div>
              <label class="mb-1 block text-sm font-medium text-secondary-700">Username</label>
              <input
                v-model="createForm.username"
                type="text"
                placeholder="johndoe"
                class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
                required
              />
            </div>

            <!-- Department -->
            <div>
              <label class="mb-1 block text-sm font-medium text-secondary-700">Department</label>
              <input
                v-model="createForm.department"
                type="text"
                placeholder="Engineering"
                class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
                required
              />
            </div>

            <!-- Email -->
            <div>
              <label class="mb-1 block text-sm font-medium text-secondary-700">Email Address</label>
              <input
                v-model="createForm.email"
                type="email"
                placeholder="you@example.com"
                class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
                required
              />
            </div>

            <!-- Password -->
            <div>
              <label class="mb-1 block text-sm font-medium text-secondary-700">Password</label>
              <input
                v-model="createForm.password"
                type="password"
                placeholder="••••••••"
                class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
                required
              />
              <p class="mt-1 text-xs text-secondary-500">At least 6 characters</p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="mb-1 block text-sm font-medium text-secondary-700">Confirm Password</label>
              <input
                v-model="createForm.confirmPassword"
                type="password"
                placeholder="••••••••"
                class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
                required
              />
            </div>

            <!-- Error -->
            <div v-if="createError" class="flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
              <svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              {{ createError }}
            </div>

            <!-- Success -->
            <div v-if="createSuccess" class="flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700">
              <svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              {{ createSuccess }}
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100"
                @click="closeCreateModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isCreating"
              >
                <span v-if="!isCreating">Create User</span>
                <span v-else class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
