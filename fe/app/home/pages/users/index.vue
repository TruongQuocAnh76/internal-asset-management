<script setup lang="ts">
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

const config = useRuntimeConfig()
const { user } = useAuth()
const users = ref<UserSummary[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const isSaving = ref(false)
const showEditModal = ref(false)
const editingUser = ref<UserSummary | null>(null)
const editForm = ref({
  role: 'Employee' as 'Admin' | 'Team Lead' | 'Employee',
  department: '',
  status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
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
    const data = await $fetch<UserSummary[]>('/users', {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })

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

const getRoles = (user: UserSummary) => {
  if (!user.user_roles?.length) return '-'
  return user.user_roles
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
    const updatedUser = await $fetch<UserSummary>(`/users/${editingUser.value.id}`, {
      method: 'PATCH',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: {
        role: editForm.value.role,
        department: editForm.value.department,
        status: editForm.value.status,
      },
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
          <p class="text-secondary-600 mt-1">Simple directory of active system users.</p>
        </div>
        <NuxtLink
          to="/home"
          class="inline-flex items-center rounded-lg bg-white border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100"
        >
          Back to Home
        </NuxtLink>
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
    </div>
  </div>
</template>
