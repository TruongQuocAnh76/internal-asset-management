<script setup lang="ts">
import KitDetailHeader from '../../../components/KitDetailHeader.vue'
import InventoryIndicator from '../../../components/InventoryIndicator.vue'
import ComponentsList from '../../../components/ComponentsList.vue'
import AuditTimeline from '../../../components/AuditTimeline.vue'
import AssignKitDialog from '../../../components/AssignKitDialog.vue'
import ManageComponentsModal from '../../../components/ManageComponentsModal.vue'
import ComponentPicker from '../../../components/ComponentPicker.vue'
import ResponsiveTabs from '../../../components/ResponsiveTabs.vue'
import LoadingSkeleton from '../../../components/LoadingSkeleton.vue'
import { useKitDetail } from '../../../composables/useKitDetail'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)

const {
  kit,
  auditLog,
  loading,
  error,
  updating,
  statusConfig,
  inventoryIndicator,
  inventoryTooltip,
  loadAll,
  loadKit,
  loadAuditLog,
  handleArchive,
  handleRestore,
  handleRemoveComponent,
  handleReplaceComponent,
  handleConvertToPlaceholder
} = useKitDetail(id.value)

// UI state
const showAssignDialog = ref(false)
const showManageComponents = ref(false)
const showReplaceModal = ref(false)
const replaceComponentId = ref<string | null>(null)
const replaceError = ref<string | null>(null)
const activeTab = ref('components')

// Tab configuration for mobile
const tabs = computed(() => [
  {
    id: 'components',
    label: 'Components',
    count: kit.value?.components?.length || 0
  },
  {
    id: 'timeline',
    label: 'Activity',
    count: auditLog.value?.length || 0
  }
])

// Load data on mount
onMounted(() => {
  loadAll()
})

// Reload if ID changes
watch(id, (newId) => {
  if (newId) {
    loadAll()
  }
})

const handleBack = () => {
  router.push('/kits')
}

const handleEdit = () => {
  // Would navigate to edit page or open edit modal
  console.log('Edit kit:', id.value)
}

const handleAssign = () => {
  showAssignDialog.value = true
}

const handleAssignSuccess = () => {
  showAssignDialog.value = false
  loadKit()
  loadAuditLog()
}

const handleManageComponents = () => {
  showManageComponents.value = true
}

const handleComponentsUpdate = () => {
  loadKit()
  loadAuditLog()
}

const handleRemove = async (componentId: string) => {
  await handleRemoveComponent(componentId)
  loadAuditLog()
}

const handleReplace = (componentId: string) => {
  replaceComponentId.value = componentId
  showReplaceModal.value = true
  replaceError.value = null
}

const handleReplaceSelect = async (asset: any, assetType: string) => {
  if (!replaceComponentId.value || !asset) return

  try {
    await handleReplaceComponent(replaceComponentId.value, asset.id)
    showReplaceModal.value = false
    replaceComponentId.value = null
  } catch (err: any) {
    replaceError.value = err.data?.message || err.message || 'Failed to replace asset. The replacement may not be available.'
  }
}

const handleConvert = async (componentId: string) => {
  await handleConvertToPlaceholder(componentId)
  loadAuditLog()
}

const onArchive = async () => {
  await handleArchive()
  loadAuditLog()
}

const onRestore = async () => {
  await handleRestore()
  loadAuditLog()
}
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back Button -->
      <button
        @click="handleBack"
        class="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-6 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Kits
      </button>

      <!-- Loading State -->
      <div v-if="loading && !kit">
        <LoadingSkeleton variant="detail" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-danger-50 border border-danger-200 rounded-xl p-6 text-center">
        <svg class="w-12 h-12 text-danger-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-lg font-semibold text-danger-800 mb-2">Error Loading Kit</h3>
        <p class="text-danger-600 mb-4">{{ error }}</p>
        <button 
          @click="loadAll" 
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Kit Content -->
      <template v-else-if="kit">
        <div class="space-y-6">
          <!-- Header -->
          <KitDetailHeader
            :kit="kit"
            :loading="updating"
            @edit="handleEdit"
            @assign="handleAssign"
            @archive="onArchive"
            @restore="onRestore"
            @manage-components="handleManageComponents"
          />

          <!-- Main Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Inventory & Components -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Inventory Indicator -->
              <InventoryIndicator
                :complete="inventoryIndicator.complete"
                :missing="inventoryIndicator.missing"
                :tooltip="inventoryTooltip"
              />

              <!-- Mobile: Tab Navigation -->
              <div class="lg:hidden">
                <ResponsiveTabs v-model="activeTab" :tabs="tabs" />
              </div>

              <!-- Components List (shown always on desktop, conditionally on mobile) -->
              <div :class="{ 'hidden lg:block': activeTab !== 'components' }">
                <ComponentsList
                  :components="kit.template.template_items || []"
                  :loading="loading"
                  @replace="handleReplace"
                  @remove="handleRemove"
                  @convert-to-placeholder="handleConvert"
                />
              </div>

              <!-- Mobile: Timeline when tab is selected -->
              <div class="lg:hidden" :class="{ 'hidden': activeTab !== 'timeline' }">
                <AuditTimeline
                  :entries="auditLog"
                  :loading="loading"
                />
              </div>
            </div>

            <!-- Right Column: Audit Timeline (desktop only) -->
            <div class="hidden lg:block lg:col-span-1">
              <AuditTimeline
                :entries="auditLog"
                :loading="loading"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Assign Kit Dialog -->
    <AssignKitDialog
      :visible="showAssignDialog"
      :kit="kit"
      @close="showAssignDialog = false"
      @success="handleAssignSuccess"
    />

    <!-- Manage Components Modal -->
    <ManageComponentsModal
      :visible="showManageComponents"
      :kit="kit"
      @close="showManageComponents = false"
      @update="handleComponentsUpdate"
    />

    <!-- Replace Component Picker -->
    <ComponentPicker
      :visible="showReplaceModal"
      @close="showReplaceModal = false; replaceComponentId = null; replaceError = null"
      @select="handleReplaceSelect"
    />

    <!-- Replace Error Toast -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div
          v-if="replaceError"
          class="fixed bottom-6 right-6 z-50 bg-danger-600 text-white rounded-lg shadow-lg px-6 py-4 max-w-md"
        >
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <p class="font-medium">Replacement Failed</p>
              <p class="text-sm text-danger-100 mt-1">{{ replaceError }}</p>
              <p class="text-sm text-danger-100 mt-2">
                <strong>Suggestions:</strong> Check if the asset is already assigned, reserved, or in maintenance.
              </p>
            </div>
            <button
              @click="replaceError = null"
              class="text-danger-200 hover:text-white"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
