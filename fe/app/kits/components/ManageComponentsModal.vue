<script setup lang="ts">
import type { Kit, KitComponent, ComponentPickerAsset } from '../types/kit.types'
import { useKits } from '../composables/useKits'
import ComponentPicker from './ComponentPicker.vue'

interface Props {
  visible: boolean
  kit: Kit | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'update': []
}>()

const { addComponentToKit, removeComponentFromKit, replaceComponentAsset, convertComponentToPlaceholder } = useKits()

const activeTab = ref<'add' | 'manage'>('manage')
const showComponentPicker = ref(false)
const isProcessing = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const replaceComponentId = ref<string | null>(null)
const showReplaceModal = ref(false)
const showConfirmRemove = ref<string | null>(null)

const handleAddComponent = async (asset: ComponentPickerAsset | null, assetType: string) => {
  if (!props.kit) return

  isProcessing.value = true
  error.value = null

  try {
    await addComponentToKit(props.kit.id, {
      assetId: asset?.id,
      assetType,
      quantity: 1,
      isPlaceholder: asset === null
    })
    successMessage.value = 'Component added successfully'
    emit('update')
    showComponentPicker.value = false
    setTimeout(() => { successMessage.value = null }, 3000)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to add component'
  } finally {
    isProcessing.value = false
  }
}

const handleRemoveComponent = async (assetId: string) => {
  if (!props.kit) return

  isProcessing.value = true
  error.value = null

  try {
    await removeComponentFromKit(props.kit.id, assetId)
    successMessage.value = 'Component removed successfully'
    emit('update')
    showConfirmRemove.value = null
    setTimeout(() => { successMessage.value = null }, 3000)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to remove component'
  } finally {
    isProcessing.value = false
  }
}

const openReplaceModal = (componentId: string) => {
  replaceComponentId.value = componentId
  showReplaceModal.value = true
}

const handleReplaceAsset = async (asset: ComponentPickerAsset | null, assetType: string) => {
  if (!props.kit || !replaceComponentId.value || !asset) return

  isProcessing.value = true
  error.value = null

  try {
    await replaceComponentAsset(props.kit.id, replaceComponentId.value, asset.id)
    successMessage.value = 'Asset replaced successfully'
    emit('update')
    showReplaceModal.value = false
    replaceComponentId.value = null
    setTimeout(() => { successMessage.value = null }, 3000)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to replace asset. The replacement asset may not be available.'
  } finally {
    isProcessing.value = false
  }
}

const handleConvertToPlaceholder = async (componentId: string) => {
  if (!props.kit) return

  isProcessing.value = true
  error.value = null

  try {
    await convertComponentToPlaceholder(props.kit.id, componentId)
    successMessage.value = 'Component converted to placeholder'
    emit('update')
    setTimeout(() => { successMessage.value = null }, 3000)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to convert component'
  } finally {
    isProcessing.value = false
  }
}

const getStatusColor = (status?: string) => {
  if (!status) return 'bg-secondary-100 text-secondary-700'
  const colors = {
    READY: 'bg-success-100 text-success-700',
    IN_USE: 'bg-primary-100 text-primary-700',
    MAINTENANCE: 'bg-warning-100 text-warning-700',
  }
  return colors[status as keyof typeof colors] || 'bg-secondary-100 text-secondary-700'
}

watch(() => props.visible, (visible) => {
  if (!visible) {
    error.value = null
    successMessage.value = null
    showConfirmRemove.value = null
    showReplaceModal.value = false
    replaceComponentId.value = null
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-secondary-200">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-secondary-900">Manage Components</h2>
                <p v-if="kit" class="text-sm text-secondary-600">{{ kit.template.name }}</p>
              </div>
              <button
                @click="emit('close')"
                class="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Tabs -->
            <div class="flex gap-4 mt-4">
              <button
                @click="activeTab = 'manage'"
                class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                :class="activeTab === 'manage' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'"
              >
                Current Components
              </button>
              <button
                @click="activeTab = 'add'"
                class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                :class="activeTab === 'add' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'"
              >
                Add Component
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Messages -->
            <div v-if="error" class="mb-4 bg-danger-50 border border-danger-200 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <span class="text-danger-700">{{ error }}</span>
                <button @click="error = null" class="ml-auto text-danger-600 hover:text-danger-800">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="successMessage" class="mb-4 bg-success-50 border border-success-200 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="text-success-700">{{ successMessage }}</span>
              </div>
            </div>

            <!-- Add Tab -->
            <div v-if="activeTab === 'add'">
              <div class="text-center py-8">
                <svg class="w-16 h-16 mx-auto text-secondary-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p class="text-secondary-600 mb-4">Add a new component to this kit</p>
                <button
                  @click="showComponentPicker = true"
                  class="px-6 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Select Component
                </button>
              </div>
            </div>

            <!-- Manage Tab -->
            <div v-else>
              <div v-if="!kit?.template?.template_items?.length" class="text-center py-8">
                <svg class="w-12 h-12 mx-auto text-secondary-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <p class="text-secondary-600">No components in this kit</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="component in kit.template.template_items"
                  :key="component.id"
                  class="border border-secondary-200 rounded-lg p-4"
                >
                  <div class="flex items-start gap-4">
                    <!-- Component Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span 
                          class="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-primary-100 text-primary-700"
                        >
                          ✓
                        </span>
                        <span class="font-medium text-secondary-900">{{ component.asset?.name || 'Unknown Asset' }}</span>
                        <span v-if="component.asset?.status" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="getStatusColor(component.asset.status)">
                          {{ component.asset.status }}
                        </span>
                      </div>
                      
                      <div v-if="component.asset" class="text-sm text-secondary-600">
                        <span class="font-mono">{{ component.asset.code }}</span>
                        <span v-if="component.asset.category?.name" class="mx-1">•</span>
                        <span v-if="component.asset.category?.name">{{ component.asset.category.name }}</span>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2">
                      <button
                        @click="openReplaceModal(component.asset_id)"
                        class="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Replace asset"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        @click="showConfirmRemove = component.asset_id"
                        :disabled="isProcessing"
                        class="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove component"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Confirm Remove -->
                  <div v-if="showConfirmRemove === component.asset_id" class="mt-4 pt-4 border-t border-secondary-200">
                    <p class="text-sm text-secondary-600 mb-3">Are you sure you want to remove this component?</p>
                    <div class="flex gap-2">
                      <button
                        @click="showConfirmRemove = null"
                        class="px-3 py-1.5 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        @click="handleRemoveComponent(component.asset_id)"
                        :disabled="isProcessing"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-secondary-200 flex justify-end">
            <button
              @click="emit('close')"
              class="px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Add Component Picker -->
    <ComponentPicker
      :visible="showComponentPicker"
      @close="showComponentPicker = false"
      @select="handleAddComponent"
    />

    <!-- Replace Asset Picker -->
    <ComponentPicker
      :visible="showReplaceModal"
      @close="showReplaceModal = false; replaceComponentId = null"
      @select="handleReplaceAsset"
    />
  </Teleport>
</template>
