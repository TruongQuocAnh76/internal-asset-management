<script setup lang="ts">
import { useAuditLogs } from '../../composables/useAuditLogs'
import type { AuditLog, AuditLookupOption } from '../../types/audit-log.types'

definePageMeta({ layout: 'default' })

const { getAuditLogs, searchUsers, searchEntities } = useAuditLogs()

const ENTITY_TYPES = ['ASSET', 'ASSET_KIT', 'KIT_ITEM', 'USER', 'CATEGORY', 'BORROW_REQUEST', 'ASSET_ALLOCATION']
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE']

const filters = ref({
  entity_type: '',
  action: '',
  actor_id: '',
  entity_id: '',
})

const logs = ref<AuditLog[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const limit = 25

const actorSearch = ref('')
const entitySearch = ref('')
const actorOptions = ref<AuditLookupOption[]>([])
const entityOptions = ref<AuditLookupOption[]>([])
const showActorOptions = ref(false)
const showEntityOptions = ref(false)
const isSearchingActor = ref(false)
const isSearchingEntity = ref(false)

let actorSearchTimer: ReturnType<typeof setTimeout> | null = null
let entitySearchTimer: ReturnType<typeof setTimeout> | null = null

const runActorSearch = () => {
  if (actorSearchTimer) clearTimeout(actorSearchTimer)

  actorSearchTimer = setTimeout(async () => {
    const query = actorSearch.value.trim()
    if (!query) {
      actorOptions.value = []
      showActorOptions.value = false
      filters.value.actor_id = ''
      return
    }

    isSearchingActor.value = true
    try {
      actorOptions.value = await searchUsers(query)
      showActorOptions.value = true
      filters.value.actor_id = ''
    } finally {
      isSearchingActor.value = false
    }
  }, 250)
}

const runEntitySearch = () => {
  if (entitySearchTimer) clearTimeout(entitySearchTimer)

  entitySearchTimer = setTimeout(async () => {
    const query = entitySearch.value.trim()
    if (!query) {
      entityOptions.value = []
      showEntityOptions.value = false
      filters.value.entity_id = ''
      return
    }

    isSearchingEntity.value = true
    try {
      entityOptions.value = await searchEntities(query)
      showEntityOptions.value = true
      filters.value.entity_id = ''
    } finally {
      isSearchingEntity.value = false
    }
  }, 250)
}

const selectActor = (option: AuditLookupOption) => {
  actorSearch.value = option.label
  filters.value.actor_id = option.id
  showActorOptions.value = false
}

const selectEntity = (option: AuditLookupOption) => {
  entitySearch.value = option.label
  filters.value.entity_id = option.id
  showEntityOptions.value = false
}

const clearActorSearch = () => {
  actorSearch.value = ''
  actorOptions.value = []
  showActorOptions.value = false
  filters.value.actor_id = ''
}

const clearEntitySearch = () => {
  entitySearch.value = ''
  entityOptions.value = []
  showEntityOptions.value = false
  filters.value.entity_id = ''
}

const hideActorOptions = () => {
  globalThis.setTimeout(() => {
    showActorOptions.value = false
  }, 150)
}

const hideEntityOptions = () => {
  globalThis.setTimeout(() => {
    showEntityOptions.value = false
  }, 150)
}

const fetchLogs = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await getAuditLogs({
      page: currentPage.value,
      limit,
      entity_type: filters.value.entity_type || undefined,
      action: filters.value.action || undefined,
      actor_id: filters.value.actor_id.trim() || undefined,
      entity_id: filters.value.entity_id.trim() || undefined,
    })
    logs.value = data.data
    total.value = data.total
    totalPages.value = data.totalPages
  } catch (e: any) {
    errorMessage.value = e?.data?.message || 'Failed to load audit logs'
  } finally {
    isLoading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchLogs()
}

const resetFilters = () => {
  filters.value = { entity_type: '', action: '', actor_id: '', entity_id: '' }
  clearActorSearch()
  clearEntitySearch()
  currentPage.value = 1
  fetchLogs()
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchLogs()
}

const selectedLog = ref<AuditLog | null>(null)

const openDetail = (log: AuditLog) => {
  selectedLog.value = log
}

const closeDetail = () => {
  selectedLog.value = null
}

const formatDate = (v: string) => new Date(v).toLocaleString()

const formatJson = (val: any): string => {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'string') {
    try { return JSON.stringify(JSON.parse(val), null, 2) } catch { return val }
  }
  return JSON.stringify(val, null, 2)
}

const actionClass = (action: string) => {
  if (action === 'CREATE') return 'bg-success-100 text-success-700'
  if (action === 'DELETE') return 'bg-danger-100 text-danger-700'
  return 'bg-warning-100 text-warning-700'
}

onMounted(fetchLogs)
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold text-secondary-900">Audit Logs</h1>
        <p class="text-secondary-600 mt-1">Track all create, update, and delete operations.</p>
      </div>

      <!-- Filters -->
      <div class="mb-4 rounded-xl border border-secondary-200 bg-white shadow-sm p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Entity Type -->
          <div>
            <label class="mb-1 block text-xs font-medium text-secondary-600 uppercase tracking-wide">Entity Type</label>
            <select
              v-model="filters.entity_type"
              class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
            >
              <option value="">All</option>
              <option v-for="e in ENTITY_TYPES" :key="e" :value="e">{{ e.replace(/_/g, ' ') }}</option>
            </select>
          </div>

          <!-- Action -->
          <div>
            <label class="mb-1 block text-xs font-medium text-secondary-600 uppercase tracking-wide">Action</label>
            <select
              v-model="filters.action"
              class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
            >
              <option value="">All</option>
              <option v-for="a in ACTIONS" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>

          <!-- Actor ID -->
          <div class="relative">
            <label class="mb-1 block text-xs font-medium text-secondary-600 uppercase tracking-wide">Actor Name</label>
            <input
              v-model="actorSearch"
              type="text"
              placeholder="Search user by name"
              class="w-full rounded-lg border border-secondary-300 px-3 py-2 pr-10 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
              @input="runActorSearch"
              @focus="showActorOptions = actorOptions.length > 0"
              @blur="hideActorOptions"
            />
            <button
              v-if="actorSearch"
              type="button"
              class="absolute right-2 top-[27px] text-secondary-400 hover:text-secondary-700"
              @click="clearActorSearch"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div
              v-if="showActorOptions"
              class="absolute z-20 mt-1 w-full rounded-lg border border-secondary-200 bg-white shadow-lg max-h-56 overflow-y-auto"
            >
              <div v-if="isSearchingActor" class="px-3 py-2 text-sm text-secondary-500">Searching...</div>
              <button
                v-for="option in actorOptions"
                :key="option.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                @click="selectActor(option)"
              >
                {{ option.label }}
              </button>
              <div v-if="!isSearchingActor && actorOptions.length === 0" class="px-3 py-2 text-sm text-secondary-500">
                No users found
              </div>
            </div>
          </div>

          <!-- Entity ID -->
          <div class="relative">
            <label class="mb-1 block text-xs font-medium text-secondary-600 uppercase tracking-wide">Asset/Kit Name</label>
            <input
              v-model="entitySearch"
              type="text"
              placeholder="Search asset or kit"
              class="w-full rounded-lg border border-secondary-300 px-3 py-2 pr-10 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none"
              @input="runEntitySearch"
              @focus="showEntityOptions = entityOptions.length > 0"
              @blur="hideEntityOptions"
            />
            <button
              v-if="entitySearch"
              type="button"
              class="absolute right-2 top-[27px] text-secondary-400 hover:text-secondary-700"
              @click="clearEntitySearch"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div
              v-if="showEntityOptions"
              class="absolute z-20 mt-1 w-full rounded-lg border border-secondary-200 bg-white shadow-lg max-h-56 overflow-y-auto"
            >
              <div v-if="isSearchingEntity" class="px-3 py-2 text-sm text-secondary-500">Searching...</div>
              <button
                v-for="option in entityOptions"
                :key="option.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                @click="selectEntity(option)"
              >
                {{ option.label }}
              </button>
              <div v-if="!isSearchingEntity && entityOptions.length === 0" class="px-3 py-2 text-sm text-secondary-500">
                No entities found
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            @click="applyFilters"
          >
            Apply
          </button>
          <button
            type="button"
            class="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
            @click="resetFilters"
          >
            Reset
          </button>
          <span class="ml-auto text-xs text-secondary-500">{{ total }} result{{ total !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-xl border border-secondary-200 bg-white shadow-sm overflow-hidden">
        <div v-if="isLoading" class="p-6 text-secondary-600">Loading...</div>
        <div v-else-if="errorMessage" class="p-6 text-danger-600">{{ errorMessage }}</div>
        <div v-else-if="logs.length === 0" class="p-6 text-secondary-600">No logs found.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-secondary-200">
            <thead class="bg-secondary-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Action</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Entity Type</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Entity ID</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Actor</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-secondary-100">
              <tr v-for="log in logs" :key="log.id" class="hover:bg-secondary-50 cursor-pointer" @click="openDetail(log)">
                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                    :class="actionClass(log.action)"
                  >
                    {{ log.action }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-secondary-700">{{ log.entity_type.replace(/_/g, ' ') }}</td>
                <td class="px-4 py-3 text-xs text-secondary-500 font-mono">{{ log.entity_id }}</td>
                <td class="px-4 py-3 text-sm text-secondary-700">
                  <span v-if="log.user">{{ log.user.first_name }} {{ log.user.last_name }}</span>
                  <span v-else class="text-xs font-mono text-secondary-400">{{ log.actor_id }}</span>
                </td>
                <td class="px-4 py-3 text-sm text-secondary-500">{{ formatDate(log.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
        <button
          type="button"
          class="rounded-lg border border-secondary-300 px-3 py-1.5 text-sm font-medium text-secondary-700 hover:bg-secondary-100 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </button>
        <span class="text-sm text-secondary-600">Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          type="button"
          class="rounded-lg border border-secondary-300 px-3 py-1.5 text-sm font-medium text-secondary-700 hover:bg-secondary-100 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>

  <!-- Detail panel overlay -->
  <Transition name="panel">
    <div v-if="selectedLog" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="closeDetail" />

      <!-- Panel -->
      <div class="panel-drawer relative z-10 w-full max-w-xl bg-white shadow-xl flex flex-col h-full overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-secondary-200 bg-secondary-50">
          <div class="flex items-center gap-3">
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="actionClass(selectedLog.action)"
            >
              {{ selectedLog.action }}
            </span>
            <span class="text-sm font-medium text-secondary-700">{{ selectedLog.entity_type.replace(/_/g, ' ') }}</span>
          </div>
          <button type="button" class="text-secondary-400 hover:text-secondary-700" @click="closeDetail">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <!-- Meta -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Actor</p>
              <p class="text-secondary-900 font-medium">
                {{ selectedLog.user ? `${selectedLog.user.first_name} ${selectedLog.user.last_name}` : selectedLog.actor_id }}
              </p>
              <p v-if="selectedLog.user" class="text-xs text-secondary-500">@{{ selectedLog.user.username }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Date</p>
              <p class="text-secondary-900">{{ formatDate(selectedLog.created_at) }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">Entity ID</p>
              <p class="font-mono text-xs text-secondary-600 break-all">{{ selectedLog.entity_id }}</p>
            </div>
          </div>

          <!-- Before / After -->
          <div class="grid grid-cols-1 gap-4">
            <div>
              <p class="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-2">Before</p>
              <pre class="rounded-lg bg-secondary-50 border border-secondary-200 p-3 text-xs text-secondary-700 overflow-x-auto whitespace-pre-wrap break-all">{{ formatJson(selectedLog.before) }}</pre>
            </div>
            <div>
              <p class="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-2">After</p>
              <pre class="rounded-lg bg-secondary-50 border border-secondary-200 p-3 text-xs text-secondary-700 overflow-x-auto whitespace-pre-wrap break-all">{{ formatJson(selectedLog.after) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease;
}
.panel-enter-active .panel-drawer,
.panel-leave-active .panel-drawer {
  transition: transform 0.25s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}
.panel-enter-from .panel-drawer,
.panel-leave-to .panel-drawer {
  transform: translateX(100%);
}
</style>
